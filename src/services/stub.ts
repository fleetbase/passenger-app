import type { Coordinate, Driver, FinalFare, Place, Quote, Ride, RideService } from './types';

const PICKUP: Place = { id: 'pickup', name: '18 Harbour Street', detail: 'Current location', location: { latitude: 1.2847, longitude: 103.8511 } };

const PLACES: Place[] = [
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
        if (!update({ status: 'driver_en_route', driver: DRIVER, route: approach, carPosition: start, etaMinutes: current.ride.quote.pickupMinutes + 1 })) {
            return;
        }
        for (let tick = 1; tick <= APPROACH_TICKS; tick++) {
            await wait(TICK_MS);
            const remaining = 1 - tick / APPROACH_TICKS;
            const eta = Math.max(1, Math.ceil(remaining * (current.ride.quote.pickupMinutes + 1)));
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
        update({ status: 'completed', fare: FARE });
    };

    return {
        async requestCode() {},
        async verifyCode() {
            return { firstName: 'Sam' };
        },
        async currentPickup() {
            return PICKUP;
        },
        async savedPlaces() {
            return PLACES.filter((place) => place.saved);
        },
        async searchPlaces(query) {
            const needle = query.trim().toLowerCase();
            return PLACES.filter((place) => !needle || place.name.toLowerCase().includes(needle));
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
            }
        },
        async rateDriver() {},
    };
}
