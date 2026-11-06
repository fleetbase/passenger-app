import Fleetbase from '@fleetbase/sdk';
import { Platform } from 'react-native';
import { NotConfiguredError } from './errors';
import { currentPosition } from './location';
import { clearSession, readSession, saveSession, type Session } from './session';
import type { ChatMessage, Coordinate, Driver, FinalFare, Place, Profile, Quote, Ride, RideService, RideSettings, RideStatus, Trip } from './types';

type CustomerResource = { name?: string; phone?: string; email?: string | null; token?: string };

type PlaceResource = {
    id?: string | null;
    name?: string | null;
    address?: string | null;
    street1?: string | null;
    city?: string | null;
    location?: { coordinates?: [number, number] } | null;
};

type QuoteResource = {
    id?: string;
    service_rate: string;
    service_name: string;
    amount: number;
    currency: string;
    meta?: { seats?: number | null; pickup_eta?: number | null };
};

type FareResource = { total: number; currency: string; lines?: { label: string; amount: number }[] };

type OrderResource = {
    id: string;
    type?: string;
    dispatched?: boolean;
    status: string;
    created_at: string;
    distance?: number;
    time?: number;
    transaction_amount?: number | null;
    currency?: string | null;
    meta?: { service_name?: string; dispatch_outcome?: string; payment?: string; fare?: FareResource };
    payload?: { pickup?: PlaceResource | null; dropoff?: PlaceResource | null; payment_method?: string | null } | null;
};

type DriverResource = {
    driver: { name: string; rating?: number | null } | null;
    vehicle: { make?: string | null; model?: string | null; color?: string | null; plate_number?: string | null } | null;
};

type TrackerResource = {
    driver?: { location?: { coordinates?: [number, number] } | null; location_age_seconds?: number | null } | null;
    route?: { legs?: { duration_s?: number | null }[] } | null;
    eta?: { completion_seconds?: number | null } | null;
};

type MessageResource = { id: string; from: 'rider' | 'driver'; text: string; sent_at: string };

type InvoiceResource = { invoice: { id: string; status: string; payment_url?: string } | null };

type Adapter = ReturnType<Fleetbase['getAdapter']>;

/** Invoice statuses after which nothing is left to pay. */
const PAID = ['paid'];

/** How often a ride in progress is refreshed. */
const POLL_MS = 3000;

/** A car position older than this is shown as out of date. */
const STALE_SECONDS = 60;

const RIDE_STATUS: Record<string, RideStatus> = {
    created: 'searching',
    dispatched: 'searching',
    started: 'driver_en_route',
    arrived: 'arrived',
    in_progress: 'in_progress',
    completed: 'completed',
    canceled: 'canceled',
    no_show: 'canceled',
};

const rideStatus = (order: OrderResource): RideStatus =>
    order.status === 'canceled' && order.meta?.dispatch_outcome === 'no_driver_found' ? 'no_driver' : (RIDE_STATUS[order.status] ?? 'searching');

const isLive = (status: RideStatus) => status === 'driver_en_route' || status === 'arrived' || status === 'in_progress';

const isOver = (status: RideStatus) => status === 'completed' || status === 'canceled' || status === 'no_driver';

const minutes = (seconds?: number | null) => (typeof seconds === 'number' ? Math.max(1, Math.round(seconds / 60)) : undefined);

const toDriver = ({ driver, vehicle }: DriverResource): Driver | undefined => {
    if (!driver) {
        return undefined;
    }
    const initials = driver.name
        .split(/\s+/)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    const car = [vehicle?.color, vehicle?.make, vehicle?.model].filter(Boolean).join(' ');
    return { name: driver.name, initials, rating: driver.rating ?? undefined, vehicle: car, plate: vehicle?.plate_number ?? '' };
};

/** The rider's place as the API takes it. Coordinates rather than an id, so only what the rider chose is sent. */
const placeInput = ({ name, detail, location }: Place) => ({ name, street1: detail || name, ...location });

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

/** The final fare, from the breakdown the server stores when the trip ends, or the fare agreed at booking. */
const toFare = (order: OrderResource, estimate: string): FinalFare | undefined => {
    const fare = order.meta?.fare;
    if (fare) {
        return { total: formatMoney(fare.total, fare.currency), estimate, lines: (fare.lines ?? []).map((line) => ({ label: line.label, amount: formatMoney(line.amount, fare.currency) })) };
    }
    return order.transaction_amount && order.currency ? { total: formatMoney(order.transaction_amount, order.currency), estimate, lines: [] } : undefined;
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
        fare: toFare(order, ''),
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
    let stopWatching = () => {};
    let onExpired = () => {};

    const adapter = (namespace?: string): Adapter => {
        if (!host || !key) {
            throw new NotConfiguredError();
        }
        return new Fleetbase(key, { host: reachableHost(host), ...(namespace ? { namespace } : {}) }).getAdapter();
    };

    /** The rider's invoice for a ride, from Ledger. Null until the final fare is billed. */
    const invoiceFor = async (rideId: string) => {
        const token = session?.token;
        if (!token) {
            throw new Error('No rider is signed in.');
        }
        const { invoice } = (await adapter('ledger/v1').get(`customers/orders/${rideId}/invoice`, {}, { headers: { 'Customer-Token': token } })) as InvoiceResource;
        return invoice;
    };

    /** Message watchers per ride, so a sent message shows straight away. */
    const chatRefreshers = new Map<string, Set<() => void>>();

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
        stopWatching();
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

    /** Refreshes a ride until it ends: its status, then once a driver accepts, who they are and where the car is. */
    const watchRide = (ride: Ride, onUpdate: (ride: Ride) => void) => {
        stopWatching();
        let current = ride;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let stopped = false;
        stopWatching = () => {
            stopped = true;
            clearTimeout(timer);
        };

        const tick = async () => {
            try {
                const order = await asRider<OrderResource>((api, options) => api.get(`customers/orders/${ride.id}`, {}, options));
                const next: Ride = { ...current, status: rideStatus(order) };
                if (isLive(next.status)) {
                    if (!next.driver) {
                        next.driver = toDriver(await asRider<DriverResource>((api, options) => api.get(`customers/orders/${ride.id}/driver`, {}, options)));
                    }
                    const tracker = await asRider<TrackerResource>((api, options) => api.get(`customers/orders/${ride.id}/tracker`, {}, options)).catch(() => undefined);
                    const coordinates = tracker?.driver?.location?.coordinates;
                    if (coordinates) {
                        next.carPosition = { latitude: coordinates[1], longitude: coordinates[0] };
                    }
                    next.stale = (tracker?.driver?.location_age_seconds ?? 0) > STALE_SECONDS;
                    next.etaMinutes = minutes(next.status === 'in_progress' ? tracker?.eta?.completion_seconds : tracker?.route?.legs?.[0]?.duration_s) ?? next.etaMinutes;
                }
                if (next.status === 'completed') {
                    next.fare = toFare(order, ride.quote.fare);
                }
                current = next;
                if (!stopped) {
                    onUpdate(next);
                }
                if (isOver(next.status)) {
                    stopWatching();
                }
            } catch {
                // A missed refresh is retried on the next tick.
            }
            if (!stopped) {
                timer = setTimeout(tick, POLL_MS);
            }
        };

        timer = setTimeout(tick, POLL_MS);
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
        async deleteAccount() {
            await asRider((api, options) => api.delete('customers/me', {}, options));
            endSession();
        },
        async rideSettings(): Promise<RideSettings> {
            const settings = await asRider<{ emergency_number?: string | null; support?: { phone?: string | null; email?: string | null } }>((api, options) => api.get('customers/ride-settings', {}, options));
            return { emergencyNumber: settings.emergency_number ?? undefined, supportPhone: settings.support?.phone ?? undefined, supportEmail: settings.support?.email ?? undefined };
        },
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
            const quotes = (await adapter().get('service-quotes', { pickup: placeParam(from), dropoff: placeParam(to), preview: 1, availability: 1 })) as QuoteResource[];
            return quotes.map(
                (quote): Quote => ({
                    id: quote.service_rate,
                    className: quote.service_name,
                    fare: formatMoney(quote.amount, quote.currency),
                    seats: quote.meta?.seats ?? undefined,
                    pickupMinutes: minutes(quote.meta?.pickup_eta),
                })
            );
        },
        async requestRide({ pickup: from, dropoff: to, quote, payment }, onUpdate) {
            // Previews can't be booked, so the chosen class is priced again as a fare the order can hold.
            const [stored] = (await adapter().get('service-quotes', { pickup: placeParam(from), dropoff: placeParam(to), service: quote.id })) as QuoteResource[];
            if (!stored?.id) {
                throw new Error('That option is no longer available. Choose another.');
            }
            const order = await asRider<OrderResource>((api, options) =>
                api.post('customers/orders', { type: 'ride', service_quote: stored.id, pickup: placeInput(from), dropoff: placeInput(to), meta: { payment } }, options)
            );
            await asRider((api, options) => api.post(`customers/orders/${order.id}/dispatch`, {}, options));
            const ride: Ride = { id: order.id, status: 'searching', pickup: from, dropoff: to, quote, payment, route: [from.location, to.location] };
            watchRide(ride, onUpdate);
            return ride;
        },
        async activeRide(onUpdate) {
            const orders = await asRider<OrderResource[]>((api, options) => api.get('customers/orders', { limit: 10, sort: '-created_at' }, options));
            const order = orders.find((candidate) => candidate.type === 'ride' && candidate.dispatched && !isOver(rideStatus(candidate)));
            const pickup = toPlace(order?.payload?.pickup);
            const dropoff = toPlace(order?.payload?.dropoff);
            if (!order || !pickup || !dropoff) {
                return undefined;
            }
            const method = order.meta?.payment;
            const ride: Ride = {
                id: order.id,
                status: rideStatus(order),
                pickup,
                dropoff,
                quote: { id: '', className: order.meta?.service_name ?? '', fare: order.transaction_amount && order.currency ? formatMoney(order.transaction_amount, order.currency) : '' },
                payment: method === 'card' ? 'card' : 'cash',
                route: [pickup.location, dropoff.location],
            };
            watchRide(ride, onUpdate);
            return ride;
        },
        async cancelRide(rideId) {
            stopWatching();
            await asRider((api, options) => api.post(`customers/orders/${rideId}/cancel`, {}, options));
        },
        async rateDriver(rideId, stars, comment) {
            await asRider((api, options) => api.post(`customers/orders/${rideId}/rating`, { stars, comment: comment?.trim() || undefined }, options));
        },
        async shareLink(rideId) {
            const { url } = await asRider<{ url: string }>((api, options) => api.post(`customers/orders/${rideId}/share`, {}, options));
            return url;
        },
        watchMessages(rideId, onChange) {
            let stopped = false;
            let timer: ReturnType<typeof setTimeout> | undefined;
            const refresh = async () => {
                clearTimeout(timer);
                try {
                    const messages = await asRider<MessageResource[]>((api, options) => api.get(`customers/orders/${rideId}/messages`, {}, options));
                    if (!stopped) {
                        onChange(messages.map((message): ChatMessage => ({ id: message.id, from: message.from, text: message.text, sentAt: message.sent_at })));
                    }
                } catch {
                    // Tried again on the next refresh.
                }
                if (!stopped) {
                    timer = setTimeout(refresh, POLL_MS);
                }
            };
            const refreshers = chatRefreshers.get(rideId) ?? new Set();
            chatRefreshers.set(rideId, refreshers);
            refreshers.add(refresh);
            onChange([]);
            refresh();
            return () => {
                stopped = true;
                clearTimeout(timer);
                refreshers.delete(refresh);
            };
        },
        async sendMessage(rideId, text) {
            await asRider((api, options) => api.post(`customers/orders/${rideId}/messages`, { text }, options));
            chatRefreshers.get(rideId)?.forEach((refresh) => refresh());
        },
        async createCheckout(rideId) {
            const invoice = await invoiceFor(rideId);
            if (!invoice?.payment_url) {
                throw new Error("Your fare isn't ready to pay yet. Try again in a moment.");
            }
            return { uri: invoice.payment_url };
        },
        async confirmPayment(rideId) {
            // Whatever the page said, only the invoice says whether the trip is paid.
            const invoice = await invoiceFor(rideId);
            return invoice && PAID.includes(invoice.status) ? 'paid' : 'failed';
        },
        async trips() {
            const orders = await asRider<OrderResource[]>((api, options) => api.get('customers/orders', { limit: 50 }, options));
            return orders.flatMap((order) => toTrip(order) ?? []).sort((a, b) => b.date.localeCompare(a.date));
        },
        async trip(tripId) {
            return toTrip(await asRider<OrderResource>((api, options) => api.get(`customers/orders/${tripId}`, {}, options)));
        },
    };
}
