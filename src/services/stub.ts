import type { ChatMessage, Coordinate, Driver, FinalFare, Place, Profile, Quote, Ride, RideService, Trip } from './types';

const PICKUP: Place = { id: 'pickup', name: '18 Harbour Street', detail: 'Current location', location: { latitude: 1.2847, longitude: 103.8511 } };

const SAMPLE_PLACES: Place[] = [
    { id: 'station', name: 'Central Station', detail: 'Station Square', location: { latitude: 1.3005, longitude: 103.8559 } },
    { id: 'market', name: 'Riverside Market', detail: '2 Riverside Walk', location: { latitude: 1.2906, longitude: 103.8465 } },
    { id: 'home', name: 'Home', detail: 'Linden Close', location: { latitude: 1.3048, longitude: 103.8318 }, saved: 'home' },
    { id: 'work', name: 'Work', detail: 'Quay Road', location: { latitude: 1.2789, longitude: 103.8536 }, saved: 'work' },
];

const QUOTES: Quote[] = [
    { id: 'economy', className: 'Economy', seats: 4, pickupMinutes: 3, fare: '$14.20' },
    { id: 'xl', className: 'XL', seats: 6, pickupMinutes: 7, fare: '$19.50' },
];

const DRIVER: Driver = { name: 'Amara N.', initials: 'AN', rating: 4.9, vehicle: 'Silver Toyota Prius', plate: 'KTX 4821' };

const FARE: FinalFare = {
    total: '$15.54',
    estimate: '$14.20',
    lines: [
        { label: 'Base fare', amount: '$3.00' },
        { label: 'Distance · 6.7 km', amount: '$8.04' },
        { label: 'Time · 15 min', amount: '$4.50' },
    ],
};

const FARE_SUMMARY = '6.7 km · 15 min';

const DAY_MS = 24 * 60 * 60 * 1000;

const sampleFare = (total: string, base: string, distance: string, time: string): FinalFare => ({
    total,
    estimate: total,
    lines: [
        { label: 'Base fare', amount: base },
        { label: 'Distance', amount: distance },
        { label: 'Time', amount: time },
    ],
});

const sampleTrips = (): Trip[] => {
    const trip = (id: string, placeId: string, daysAgo: number, className: string, fare?: FinalFare, summary?: string): Trip => {
        const dropoff = SAMPLE_PLACES.find((place) => place.id === placeId) as Place;
        return {
            id,
            status: fare ? 'completed' : 'canceled',
            date: new Date(Date.now() - daysAgo * DAY_MS).toISOString(),
            className,
            pickup: PICKUP,
            dropoff,
            route: routeBetween(PICKUP.location, dropoff.location),
            payment: 'cash',
            paid: !!fare,
            driver: fare ? DRIVER : undefined,
            fare,
            summary,
        };
    };
    return [
        trip('trip_3', 'market', 3, 'Economy', sampleFare('$9.80', '$3.00', '$4.20', '$2.60'), '3.5 km · 9 min'),
        trip('trip_2', 'home', 8, 'XL', sampleFare('$21.10', '$4.00', '$11.60', '$5.50'), '8.3 km · 18 min'),
        trip('trip_1', 'work', 13, 'Economy'),
    ];
};

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
export function createStubService(): RideService {
    let active: Active | undefined;
    let places = SAMPLE_PLACES;
    let trips = sampleTrips();
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
        const start: Coordinate = { latitude: current.ride.pickup.location.latitude - 0.009, longitude: current.ride.pickup.location.longitude + 0.012 };
        const approach = routeBetween(start, current.ride.pickup.location);
        if (!update({ status: 'driver_en_route', driver: DRIVER, route: approach, carPosition: start, etaMinutes: (current.ride.quote.pickupMinutes ?? 3) + 1 })) {
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
        async requestCode() {
            return { newRider: false };
        },
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
            return QUOTES;
        },
        async requestRide({ pickup, dropoff, quote, payment }, onUpdate) {
            const ride: Ride = { id: `ride_${Date.now()}`, status: 'searching', pickup, dropoff, quote, payment, route: routeBetween(pickup.location, dropoff.location) };
            active = { ride, timers: [], canceled: false };
            run(active, onUpdate);
            return ride;
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
