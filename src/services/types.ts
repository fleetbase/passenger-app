export type Coordinate = { latitude: number; longitude: number };

export type Place = {
    id: string;
    name: string;
    detail: string;
    location: Coordinate;
    saved?: 'home' | 'work';
};

export type PaymentMethod = 'cash' | 'card';

/** An estimate for one car class. Fares are always estimates until the trip ends. */
export type Quote = {
    id: string;
    className: string;
    seats: number;
    pickupMinutes: number;
    fare: string;
};

export type Driver = {
    name: string;
    initials: string;
    rating: number;
    vehicle: string;
    plate: string;
};

export type FinalFare = {
    total: string;
    estimate: string;
    lines: { label: string; amount: string }[];
};

export type RideStatus = 'searching' | 'no_driver' | 'driver_en_route' | 'arrived' | 'in_progress' | 'completed' | 'canceled';

export type Ride = {
    id: string;
    status: RideStatus;
    pickup: Place;
    dropoff: Place;
    quote: Quote;
    payment: PaymentMethod;
    route: Coordinate[];
    driver?: Driver;
    carPosition?: Coordinate;
    etaMinutes?: number;
    fare?: FinalFare;
};

/**
 * Everything the screens need from a backend. `stub.ts` implements it with sample data
 * until the Fleet-Ops rider API exists; the real implementation replaces it without
 * changing any screen.
 */
export interface RideService {
    requestCode(phone: string): Promise<void>;
    verifyCode(phone: string, code: string): Promise<{ firstName: string }>;
    currentPickup(): Promise<Place>;
    savedPlaces(): Promise<Place[]>;
    searchPlaces(query: string): Promise<Place[]>;
    quotes(pickup: Place, dropoff: Place): Promise<Quote[]>;
    requestRide(args: { pickup: Place; dropoff: Place; quote: Quote; payment: PaymentMethod }, onUpdate: (ride: Ride) => void): Promise<Ride>;
    cancelRide(rideId: string): Promise<void>;
    rateDriver(rideId: string, stars: number, comment?: string): Promise<void>;
}
