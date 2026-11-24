import type { SampleArea } from '../preview/host';
import type { ChatMessage, Coordinate, Driver, FinalFare, Place, Profile, Quote, Ride, RideService, Trip } from './types';

/** Where the sample places are when nobody says: the centre of the area the app was first built around. */
const DEFAULT_CENTER: Coordinate = { latitude: 1.2847, longitude: 103.8511 };

/** Each sample place, as an offset from the pickup, so the same journey works in any city. */
const PLACE_OFFSETS: Array<Omit<Place, 'location'> & { offset: Coordinate }> = [
    { id: 'station', name: 'Central Station', detail: 'Station Square', offset: { latitude: 0.0158, longitude: 0.0048 } },
    { id: 'market', name: 'Riverside Market', detail: '2 Riverside Walk', offset: { latitude: 0.0059, longitude: -0.0046 } },
    { id: 'home', name: 'Home', detail: 'Linden Close', offset: { latitude: 0.0201, longitude: -0.0193 }, saved: 'home' },
    { id: 'work', name: 'Work', detail: 'Quay Road', offset: { latitude: -0.0058, longitude: 0.0025 }, saved: 'work' },
];

/**
 * Roughly how many of a currency one sample dollar is, so a fare reads like a real one there.
 * Currencies not listed use the amounts as they are.
 */
const CURRENCY_SCALE: Record<string, number> = {
    JPY: 150,
    KRW: 1300,
    IDR: 15000,
    VND: 25000,
    INR: 80,
    PHP: 55,
    THB: 35,
    TWD: 30,
    PKR: 280,
    NGN: 1500,
    KES: 130,
    EGP: 48,
    TRY: 34,
    ZAR: 18,
    MXN: 18,
    BRL: 5,
    CNY: 7,
    HKD: 8,
    MYR: 4.5,
    AED: 3.7,
    SAR: 3.75,
    QAR: 3.6,
    COP: 4000,
    CLP: 900,
    ARS: 900,
};

/** Formats a sample amount, given in dollars, in the area's currency. */
export function sampleMoney(dollars: number, currency?: string): string {
    if (!currency) {
        return `$${dollars.toFixed(2)}`;
    }
    const amount = dollars * (CURRENCY_SCALE[currency] ?? 1);
    try {
        const format = new Intl.NumberFormat('en', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' });
        const digits = format.resolvedOptions().maximumFractionDigits ?? 2;
        const step = digits === 0 ? (amount >= 1000 ? 100 : 10) : 0.01;
        return format.format(Math.round(amount / step) * step);
    } catch {
        return `${currency} ${amount.toFixed(2)}`;
    }
}

/** The sample places, fares and trips, around a centre and in a currency. */
export function sampleWorld({ center = DEFAULT_CENTER, currency }: SampleArea = {}) {
    const money = (dollars: number) => sampleMoney(dollars, currency);
    const pickup: Place = { id: 'pickup', name: '18 Harbour Street', detail: 'Current location', location: center };
    const places: Place[] = PLACE_OFFSETS.map(({ offset, ...place }) => ({
        ...place,
        location: { latitude: center.latitude + offset.latitude, longitude: center.longitude + offset.longitude },
    }));
    const quotes: Quote[] = [
        { id: 'economy', className: 'Economy', seats: 4, pickupMinutes: 3, fare: money(14.2) },
        { id: 'xl', className: 'XL', seats: 6, pickupMinutes: 7, fare: money(19.5) },
    ];
    const fare: FinalFare = {
        total: money(15.54),
        estimate: money(14.2),
        lines: [
            { label: 'Base fare', amount: money(3) },
            { label: 'Distance · 6.7 km', amount: money(8.04) },
            { label: 'Time · 15 min', amount: money(4.5) },
        ],
    };
    const sampleFare = (total: number, base: number, distance: number, time: number): FinalFare => ({
        total: money(total),
        estimate: money(total),
        lines: [
            { label: 'Base fare', amount: money(base) },
            { label: 'Distance', amount: money(distance) },
            { label: 'Time', amount: money(time) },
        ],
    });
    const trips = (): Trip[] => {
        const trip = (id: string, placeId: string, daysAgo: number, className: string, tripFare?: FinalFare, summary?: string): Trip => {
            const dropoff = places.find((place) => place.id === placeId) as Place;
            return {
                id,
                status: tripFare ? 'completed' : 'canceled',
                date: new Date(Date.now() - daysAgo * DAY_MS).toISOString(),
                className,
                pickup,
                dropoff,
                route: routeBetween(pickup.location, dropoff.location),
                payment: 'cash',
                paid: !!tripFare,
                driver: tripFare ? DRIVER : undefined,
                fare: tripFare,
                summary,
            };
        };
        return [
            trip('trip_3', 'market', 3, 'Economy', sampleFare(9.8, 3, 4.2, 2.6), '3.5 km · 9 min'),
            trip('trip_2', 'home', 8, 'XL', sampleFare(21.1, 4, 11.6, 5.5), '8.3 km · 18 min'),
            trip('trip_1', 'work', 13, 'Economy'),
        ];
    };
    return { pickup, places, quotes, fare, trips };
}

const DRIVER: Driver = { name: 'Amara N.', initials: 'AN', rating: 4.9, vehicle: 'Silver Toyota Prius', plate: 'KTX 4821' };

const FARE_SUMMARY = '6.7 km · 15 min';

const DAY_MS = 24 * 60 * 60 * 1000;

const DRIVER_REPLY = 'Thanks, see you soon.';
const REPLY_MS = 1500;

/** Stands in for the provider's hosted page. It takes no card details, so nothing real can be entered. */
const sampleCheckout = (total: string) => `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body { margin: 0; padding: 24px; font: 16px/1.4 -apple-system, system-ui, sans-serif; color: #111827; background: #fff; }
h1 { font-size: 22px; margin: 0 0 8px; }
p { color: #4B5563; margin: 0 0 24px; }
button { display: block; width: 100%; height: 52px; margin-bottom: 12px; border: 0; border-radius: 12px; font: 600 17px -apple-system, system-ui, sans-serif; }
#pay { background: #111827; color: #fff; }
#decline { background: #F3F5F7; color: #111827; }
</style>
</head>
<body>
<h1>Sample checkout</h1>
<p>This page stands in for your payment provider. No card is charged.</p>
<button id="pay">Pay ${total}</button>
<button id="decline">Decline this payment</button>
<script>
function report(result) {
    if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(result);
    } else {
        window.parent.postMessage(result, '*');
    }
}
document.getElementById('pay').onclick = function () { report('paid'); };
document.getElementById('decline').onclick = function () { report('failed'); };
</script>
</body>
</html>`;

const SEARCH_MS = 4000;
const APPROACH_TICKS = 16;
const WAIT_MS = 5000;
const TRIP_TICKS = 20;
const TICK_MS = 1000;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const lerp = (from: Coordinate, to: Coordinate, t: number): Coordinate => ({
    latitude: from.latitude + (to.latitude - from.latitude) * t,
    longitude: from.longitude + (to.longitude - from.longitude) * t,
});

/** A simple street-like route with one corner, since the stub has no routing engine. */
const routeBetween = (from: Coordinate, to: Coordinate): Coordinate[] => [from, { latitude: to.latitude, longitude: from.longitude }, to];

const along = (points: Coordinate[], t: number): Coordinate => {
    const scaled = t * (points.length - 1);
    const index = Math.min(Math.floor(scaled), points.length - 2);
    return lerp(points[index], points[index + 1], scaled - index);
};

type Active = { ride: Ride; timers: ReturnType<typeof setTimeout>[]; canceled: boolean };

/** Sample data and a simulated driver, so the whole journey runs with no backend. */
export function createStubService(area?: SampleArea): RideService {
    const world = sampleWorld(area);
    const PICKUP = world.pickup;
    const FARE = world.fare;
    let active: Active | undefined;
    let places = world.places;
    let trips = world.trips();
    let nextId = 1;
    const chats = new Map<string, ChatMessage[]>();
    const watchers = new Map<string, Set<(messages: ChatMessage[]) => void>>();

    const addMessage = (rideId: string, from: ChatMessage['from'], text: string) => {
        const messages = [...(chats.get(rideId) ?? []), { id: `message_${nextId++}`, from, text, sentAt: new Date().toISOString() }];
        chats.set(rideId, messages);
        watchers.get(rideId)?.forEach((notify) => notify(messages));
    };

    const addTrip = (ride: Ride, status: Trip['status']) => {
        trips = [
            {
                id: ride.id,
                status,
                date: new Date().toISOString(),
                className: ride.quote.className,
                pickup: ride.pickup,
                dropoff: ride.dropoff,
                route: routeBetween(ride.pickup.location, ride.dropoff.location),
                payment: ride.payment,
                paid: status === 'completed' && ride.payment === 'cash',
                driver: ride.driver,
                fare: status === 'completed' ? ride.fare : undefined,
                summary: status === 'completed' ? FARE_SUMMARY : undefined,
            },
            ...trips,
        ];
    };

    const run = async (current: Active, onUpdate: (ride: Ride) => void) => {
        const update = (patch: Partial<Ride>) => {
            if (current.canceled) {
                return false;
            }
            current.ride = { ...current.ride, ...patch };
            onUpdate(current.ride);
            return true;
        };

        await wait(SEARCH_MS);
        const start: Coordinate = {
            latitude: current.ride.pickup.location.latitude - 0.009,
            longitude: current.ride.pickup.location.longitude + 0.012,
        };
        const approach = routeBetween(start, current.ride.pickup.location);
        if (
            !update({
                status: 'driver_en_route',
                driver: DRIVER,
                route: approach,
                carPosition: start,
                etaMinutes: (current.ride.quote.pickupMinutes ?? 3) + 1,
            })
        ) {
            return;
        }
        for (let tick = 1; tick <= APPROACH_TICKS; tick++) {
            await wait(TICK_MS);
            const remaining = 1 - tick / APPROACH_TICKS;
            const eta = Math.max(1, Math.ceil(remaining * ((current.ride.quote.pickupMinutes ?? 3) + 1)));
            if (!update({ carPosition: along(approach, tick / APPROACH_TICKS), etaMinutes: eta })) {
                return;
            }
        }
        if (!update({ status: 'arrived', etaMinutes: 0 })) {
            return;
        }
        await wait(WAIT_MS);
        const trip = routeBetween(current.ride.pickup.location, current.ride.dropoff.location);
        if (!update({ status: 'in_progress', route: trip, etaMinutes: 15 })) {
            return;
        }
        for (let tick = 1; tick <= TRIP_TICKS; tick++) {
            await wait(TICK_MS);
            const remaining = 1 - tick / TRIP_TICKS;
            if (!update({ carPosition: along(trip, tick / TRIP_TICKS), etaMinutes: Math.max(1, Math.ceil(remaining * 15)) })) {
                return;
            }
        }
        if (update({ status: 'completed', fare: FARE })) {
            addTrip(current.ride, 'completed');
        }
    };

    return {
        async restoreSession() {
            return undefined;
        },
        onSessionExpired() {},
        async signOut() {},
        // Sample data has no server to send pushes.
        async registerDevice() {},
        async requestCode() {},
        async verifyCode(phone) {
            return { firstName: 'Sam', lastName: 'Reed', phone } satisfies Profile;
        },
        async updateProfile(profile) {
            return profile;
        },
        async deleteAccount() {
            places = places.filter((place) => !place.saved);
            trips = [];
        },
        async rideSettings() {
            return {};
        },
        async currentPickup() {
            return PICKUP;
        },
        async savedPlaces() {
            return places.filter((place) => place.saved);
        },
        async savePlace({ id, name, address }) {
            const existing = places.find((place) => place.id === id);
            if (existing) {
                const updated = { ...existing, name, detail: address };
                places = places.map((place) => (place.id === id ? updated : place));
                return updated;
            }
            // The stub has no geocoder, so a new address lands a short way from the pickup.
            const offset = 0.004 + (nextId % 5) * 0.003;
            const created: Place = {
                id: `place_${nextId++}`,
                name,
                detail: address,
                saved: 'custom',
                location: { latitude: PICKUP.location.latitude + offset, longitude: PICKUP.location.longitude - offset },
            };
            places = [...places, created];
            return created;
        },
        async deletePlace(placeId) {
            places = places.filter((place) => place.id !== placeId);
        },
        async searchPlaces(query) {
            const needle = query.trim().toLowerCase();
            return places.filter((place) => !needle || place.name.toLowerCase().includes(needle));
        },
        async quotes() {
            return world.quotes;
        },
        async requestRide({ pickup, dropoff, quote, payment }, onUpdate) {
            const ride: Ride = {
                id: `ride_${Date.now()}`,
                status: 'searching',
                pickup,
                dropoff,
                quote,
                payment,
                route: routeBetween(pickup.location, dropoff.location),
            };
            active = { ride, timers: [], canceled: false };
            run(active, onUpdate);
            return ride;
        },
        async activeRide() {
            return active && !active.canceled ? active.ride : undefined;
        },
        async cancelRide() {
            if (active) {
                active.canceled = true;
                addTrip(active.ride, 'canceled');
            }
        },
        async rateDriver() {},
        async shareLink(rideId) {
            return `https://example.com/track/${rideId}`;
        },
        watchMessages(rideId, onChange) {
            const set = watchers.get(rideId) ?? new Set();
            watchers.set(rideId, set);
            set.add(onChange);
            onChange(chats.get(rideId) ?? []);
            return () => {
                set.delete(onChange);
            };
        },
        async sendMessage(rideId, text) {
            addMessage(rideId, 'rider', text);
            setTimeout(() => addMessage(rideId, 'driver', DRIVER_REPLY), REPLY_MS);
        },
        async createCheckout() {
            return { html: sampleCheckout(active?.ride.fare?.total ?? FARE.total) };
        },
        async confirmPayment(rideId, reported) {
            if (reported === 'paid') {
                trips = trips.map((trip) => (trip.id === rideId ? { ...trip, paid: true } : trip));
            }
            return reported;
        },
        async trips() {
            return trips;
        },
        async trip(tripId) {
            return trips.find((trip) => trip.id === tripId);
        },
    };
}
