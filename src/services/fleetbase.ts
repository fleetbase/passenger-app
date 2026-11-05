import Fleetbase from '@fleetbase/sdk';
import { Platform } from 'react-native';
import { NotConfiguredError, NotConnectedError } from './errors';
import { currentPosition } from './location';
import { clearSession, readSession, saveSession, type Session } from './session';
import type { Coordinate, Place, Profile, Quote, RideService, Trip } from './types';

type CustomerResource = { name?: string; phone?: string; email?: string | null; token?: string };

type PlaceResource = {
    id?: string | null;
    name?: string | null;
    address?: string | null;
    street1?: string | null;
    city?: string | null;
    location?: { coordinates?: [number, number] } | null;
};

type QuoteResource = { service_rate: string; service_name: string; amount: number; currency: string };

type OrderResource = {
    id: string;
    status: string;
    created_at: string;
    distance?: number;
    time?: number;
    transaction_amount?: number | null;
    currency?: string | null;
    meta?: { service_name?: string };
    payload?: { pickup?: PlaceResource | null; dropoff?: PlaceResource | null; payment_method?: string | null } | null;
};

type Adapter = ReturnType<Fleetbase['getAdapter']>;

const CURRENT_LOCATION = 'current-location';
const PICKUP_LIFETIME_MS = 30000;

const toProfile = (customer: CustomerResource, phone: string): Profile => {
    const [firstName = '', ...rest] = (customer.name ?? '').trim().split(/\s+/);
    return { firstName, lastName: rest.join(' '), phone: customer.phone ?? phone, email: customer.email || undefined };
};

const savedKind = (name: string): Place['saved'] => {
    const lower = name.toLowerCase();
    return lower === 'home' || lower === 'work' ? lower : 'custom';
};

/** The API stores new places in capitals, which reads as shouting on a phone. */
const readable = (text?: string | null) => (text && text === text.toUpperCase() ? text.toLowerCase().replace(/(^|[\s,-])(\p{L})/gu, (_, gap, letter) => gap + letter.toUpperCase()) : text);

const toPlace = (resource?: PlaceResource | null): Place | undefined => {
    const coordinates = resource?.location?.coordinates;
    if (!resource || !coordinates) {
        return undefined;
    }
    const [longitude, latitude] = coordinates;
    const name = readable(resource.name || resource.street1 || resource.address) ?? '';
    const detail = [readable(resource.street1), readable(resource.city)].filter((part) => part && part !== name).join(', ');
    // Addresses found by the geocoder aren't stored, so they have no id.
    return { id: resource.id || `geo:${latitude},${longitude}`, name, detail, location: { latitude, longitude } };
};

/** Amounts are in the currency's smallest unit, so yen has no cents to divide out. */
const formatMoney = (amount: number, currency: string) => {
    const format = new Intl.NumberFormat(undefined, { style: 'currency', currency });
    return format.format(amount / 10 ** (format.resolvedOptions().maximumFractionDigits ?? 2));
};

const toSummary = (order: OrderResource) => {
    if (!order.distance || !order.time) {
        return undefined;
    }
    return `${(order.distance / 1000).toFixed(1)} km · ${Math.round(order.time / 60)} min`;
};

const toTrip = (order: OrderResource): Trip | undefined => {
    const pickup = toPlace(order.payload?.pickup);
    const dropoff = toPlace(order.payload?.dropoff);
    if ((order.status !== 'completed' && order.status !== 'canceled') || !pickup || !dropoff) {
        return undefined;
    }
    const method = order.payload?.payment_method;
    return {
        id: order.id,
        status: order.status,
        date: order.created_at,
        className: order.meta?.service_name ?? '',
        pickup,
        dropoff,
        route: [pickup.location, dropoff.location],
        payment: method === 'cash' || method === 'card' ? method : undefined,
        fare: order.transaction_amount && order.currency ? { total: formatMoney(order.transaction_amount, order.currency), estimate: '', lines: [] } : undefined,
        summary: toSummary(order),
    };
};

/** A stored place by id. Anything else by where it is, because the API can't look it up. */
const placeParam = ({ id, location }: Place): string | Coordinate => (id.startsWith('place_') ? id : location);

const reachableHost = (host: string) => {
    // An Android emulator reaches the machine it runs on through this address.
    if (Platform.OS === 'android') {
        return host.replace(/\/\/(localhost|127\.0\.0\.1)/, '//10.0.2.2');
    }
    // `yarn web` proxies the API (webpack.config.js), because the API blocks other origins.
    return Platform.OS === 'web' && __DEV__ ? (globalThis as unknown as { location: { origin: string } }).location.origin : host;
};

/**
 * `RideService` on the Fleet-Ops API, using a key with the rider profile. Rider data is connected; the rest is added milestone by
 * milestone (see ride-hailing/FLEETOPS-INTEGRATION-PLAN.md) and fails clearly until then.
 */
export function createFleetbaseService({ host, key }: { host: string; key: string }): RideService {
    let session: Session | undefined;
    let pickup: { at: number; place: Promise<Place> } | undefined;
    let onExpired = () => {};

    const adapter = (): Adapter => {
        if (!host || !key) {
            throw new NotConfiguredError();
        }
        return new Fleetbase(key, { host: reachableHost(host) }).getAdapter();
    };

    const startSession = (customer: CustomerResource, phone: string) => {
        if (!customer.token) {
            throw new Error('The server signed the rider in without a token.');
        }
        session = { token: customer.token, profile: toProfile(customer, phone) };
        // If this fails the rider stays signed in until the app closes. Never fall back to plain storage.
        saveSession(session).catch(() => {});
        return session.profile;
    };

    const endSession = () => {
        session = undefined;
        pickup = undefined;
        clearSession().catch(() => {});
    };

    /** Runs a call as the signed-in rider. A rejected token ends the session. */
    const asRider = async <T>(call: (api: Adapter, options: { headers: Record<string, string> }) => Promise<unknown>): Promise<T> => {
        const token = session?.token;
        if (!token) {
            throw new Error('No rider is signed in.');
        }
        try {
            return (await call(adapter(), { headers: { 'Customer-Token': token } })) as T;
        } catch (cause) {
            if ((cause as { status?: number }).status === 401 && session?.token === token) {
                endSession();
                onExpired();
            }
            throw cause;
        }
    };

    const notConnected = (method: string) => () => Promise.reject(new NotConnectedError(method));

    const savedPlaces = async () => {
        const places = await asRider<PlaceResource[]>((api, options) => api.get('customers/places', {}, options));
        return places.flatMap((resource) => {
            const place = toPlace(resource);
            return place ? [{ ...place, saved: savedKind(place.name) }] : [];
        });
    };

    const currentPickup = () => {
        if (!pickup || Date.now() - pickup.at > PICKUP_LIFETIME_MS) {
            const place = currentPosition().then(async (location): Promise<Place> => {
                const found = await asRider<PlaceResource[]>((api, options) => api.get('customers/geocode', location, options)).catch(() => []);
                const address = toPlace(found[0]);
                // A pickup without a street name is still a pickup, so a failed lookup doesn't stop it.
                return { id: CURRENT_LOCATION, name: address?.name || 'Current location', detail: address?.detail ?? '', location };
            });
            const entry = { at: Date.now(), place };
            pickup = entry;
            place.catch(() => {
                if (pickup === entry) {
                    pickup = undefined;
                }
            });
        }
        return pickup.place;
    };

    return {
        async restoreSession(onRefreshed) {
            const saved = await readSession().catch(() => undefined);
            if (!saved) {
                return undefined;
            }
            session = saved;
            // Show the saved rider straight away, so a slow network doesn't hold up the app.
            asRider<CustomerResource>((api, options) => api.get('customers/me', {}, options))
                .then((customer) => {
                    if (session?.token === saved.token) {
                        session = { token: saved.token, profile: toProfile(customer, saved.profile.phone) };
                        saveSession(session).catch(() => {});
                        onRefreshed(session.profile);
                    }
                })
                .catch(() => {});
            return saved.profile;
        },
        onSessionExpired(listener) {
            onExpired = listener;
        },
        async signOut() {
            const token = session?.token;
            endSession();
            if (token) {
                await adapter().post('customers/logout', {}, { headers: { 'Customer-Token': token } }).catch(() => {});
            }
        },
        async requestCode(phone) {
            await adapter().post('customers/request-code', { phone });
        },
        async verifyCode(phone, code, name) {
            const customer = (name ? await adapter().post('customers', { identity: phone, code, name }) : await adapter().post('customers/verify-code', { identity: phone, code })) as CustomerResource & { status?: string };
            // Only a proven code reveals that the number has no account yet.
            return customer.status === 'new_customer' ? 'needs-name' : startSession(customer, phone);
        },
        async updateProfile(profile) {
            // The phone number stays out: this route changes it without verifying the new one.
            const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
            const customer = await asRider<CustomerResource>((api, options) => api.put('customers/me', { name, email: profile.email ?? null }, options));
            const next = toProfile(customer, profile.phone);
            if (session) {
                session = { ...session, profile: next };
                saveSession(session).catch(() => {});
            }
            return next;
        },
        deleteAccount: notConnected('deleteAccount'),
        currentPickup,
        savedPlaces,
        async savePlace({ id, name, address }) {
            const found = await asRider<PlaceResource[]>((api, options) => api.get('customers/geocode', { query: address }, options));
            const location = toPlace(found[0])?.location;
            if (!location) {
                throw new Error("We couldn't find that address. Try adding the city.");
            }
            const body = { name, street1: address, ...location };
            const saved = await asRider<PlaceResource>((api, options) => (id ? api.put(`customers/places/${id}`, body, options) : api.post('customers/places', body, options)));
            return { ...(toPlace(saved) as Place), saved: savedKind(name) };
        },
        async deletePlace(placeId) {
            await asRider((api, options) => api.delete(`customers/places/${placeId}`, {}, options));
        },
        async searchPlaces(query) {
            if (!query.trim()) {
                return savedPlaces();
            }
            const near = await currentPickup().catch(() => undefined);
            const places = await asRider<PlaceResource[]>((api, options) => api.get('customers/places/search', { query, limit: 10, latitude: near?.location.latitude, longitude: near?.location.longitude }, options));
            // The geocoder also returns addresses that are only nearby, so put real matches first.
            const found = places.flatMap((resource) => toPlace(resource) ?? []);
            const matches = (place: Place) => place.name.toLowerCase().includes(query.trim().toLowerCase());
            return [...found.filter(matches), ...found.filter((place) => !matches(place))];
        },
        async quotes(from, to) {
            const quotes = (await adapter().get('service-quotes', { pickup: placeParam(from), dropoff: placeParam(to), preview: 1 })) as QuoteResource[];
            return quotes.map((quote): Quote => ({ id: quote.service_rate, className: quote.service_name, fare: formatMoney(quote.amount, quote.currency) }));
        },
        requestRide: notConnected('requestRide'),
        cancelRide: notConnected('cancelRide'),
        rateDriver: notConnected('rateDriver'),
        shareLink: notConnected('shareLink'),
        watchMessages() {
            return () => {};
        },
        sendMessage: notConnected('sendMessage'),
        createCheckout: notConnected('createCheckout'),
        confirmPayment: notConnected('confirmPayment'),
        async trips() {
            const orders = await asRider<OrderResource[]>((api, options) => api.get('customers/orders', { limit: 50 }, options));
            return orders.flatMap((order) => toTrip(order) ?? []).sort((a, b) => b.date.localeCompare(a.date));
        },
        async trip(tripId) {
            return toTrip(await asRider<OrderResource>((api, options) => api.get(`customers/orders/${tripId}`, {}, options)));
        },
    };
}
