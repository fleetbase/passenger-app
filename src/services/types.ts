export type Coordinate = { latitude: number; longitude: number };

export type Place = {
    id: string;
    name: string;
    detail: string;
    location: Coordinate;
    saved?: 'home' | 'work' | 'custom';
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

export type Profile = {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
};

/** A finished or canceled ride, as trip history and receipts show it. */
export type Trip = {
    id: string;
    status: 'completed' | 'canceled';
    /** ISO 8601. */
    date: string;
    className: string;
    pickup: Place;
    dropoff: Place;
    route: Coordinate[];
    payment: PaymentMethod;
    paid: boolean;
    driver?: Driver;
    fare?: FinalFare;
    /** For example "6.7 km · 15 min". */
    summary?: string;
};

export type ChatMessage = {
    id: string;
    from: 'rider' | 'driver';
    text: string;
    /** ISO 8601. */
    sentAt: string;
};

/** A saved place as the rider enters it. The service works out where the address is. */
export type PlaceDraft = {
    id?: string;
    name: string;
    address: string;
};

/**
 * A page hosted by the payment provider. When the rider finishes, the page reports `paid`
 * or `failed` with `window.ReactNativeWebView.postMessage` in the apps, or
 * `window.parent.postMessage` on the web.
 */
export type Checkout = { uri: string } | { html: string };

export type PaymentResult = 'paid' | 'failed';

/**
 * Everything the screens need from a backend. `stub.ts` implements it with sample data
 * until the Fleet-Ops rider API exists; the real implementation replaces it without
 * changing any screen.
 */
export interface RideService {
    requestCode(phone: string): Promise<void>;
    verifyCode(phone: string, code: string): Promise<Profile>;
    updateProfile(profile: Profile): Promise<Profile>;
    deleteAccount(): Promise<void>;
    currentPickup(): Promise<Place>;
    savedPlaces(): Promise<Place[]>;
    savePlace(draft: PlaceDraft): Promise<Place>;
    deletePlace(placeId: string): Promise<void>;
    searchPlaces(query: string): Promise<Place[]>;
    quotes(pickup: Place, dropoff: Place): Promise<Quote[]>;
    requestRide(args: { pickup: Place; dropoff: Place; quote: Quote; payment: PaymentMethod }, onUpdate: (ride: Ride) => void): Promise<Ride>;
    cancelRide(rideId: string): Promise<void>;
    rateDriver(rideId: string, stars: number, comment?: string): Promise<void>;
    /** A link someone else can open to follow the trip live. */
    shareLink(rideId: string): Promise<string>;
    /** Calls `onChange` straight away and on every new message. Returns a function that stops watching. */
    watchMessages(rideId: string, onChange: (messages: ChatMessage[]) => void): () => void;
    sendMessage(rideId: string, text: string): Promise<void>;
    createCheckout(rideId: string): Promise<Checkout>;
    /** The checkout page only reports a result. The backend decides whether the trip is paid. */
    confirmPayment(rideId: string, reported: PaymentResult): Promise<PaymentResult>;
    trips(): Promise<Trip[]>;
    trip(tripId: string): Promise<Trip | undefined>;
}
