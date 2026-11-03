import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createStubService } from '../services/stub';
import type { PaymentMethod, Place, Quote, Ride, RideService } from '../services/types';

const service: RideService = createStubService();

type AppState = {
    service: RideService;
    firstName?: string;
    signIn: (firstName: string) => void;
    dropoff?: Place;
    setDropoff: (place: Place) => void;
    ride?: Ride;
    requestRide: (args: { pickup: Place; quote: Quote; payment: PaymentMethod }) => Promise<void>;
    cancelRide: () => Promise<void>;
    clearRide: () => void;
};

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [firstName, setFirstName] = useState<string>();
    const [dropoff, setDropoff] = useState<Place>();
    const [ride, setRide] = useState<Ride>();

    const requestRide = useCallback<AppState['requestRide']>(
        async ({ pickup, quote, payment }) => {
            if (!dropoff) {
                return;
            }
            setRide(await service.requestRide({ pickup, dropoff, quote, payment }, setRide));
        },
        [dropoff]
    );

    const cancelRide = useCallback(async () => {
        if (ride) {
            await service.cancelRide(ride.id);
        }
        setRide(undefined);
    }, [ride]);

    const value = useMemo<AppState>(
        () => ({ service, firstName, signIn: setFirstName, dropoff, setDropoff, ride, requestRide, cancelRide, clearRide: () => setRide(undefined) }),
        [firstName, dropoff, ride, requestRide, cancelRide]
    );

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
    const state = useContext(AppContext);
    if (!state) {
        throw new Error('useApp must be used inside AppProvider');
    }
    return state;
}
