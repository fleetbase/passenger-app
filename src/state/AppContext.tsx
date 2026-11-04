import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { branding } from '../branding';
import type { Appearance } from '../branding/schema';
import { createService, sampleMode } from '../services';
import type { PaymentMethod, Place, Profile, Quote, Ride, RideService } from '../services/types';

const service: RideService = createService();

const PROFILE_KEY = 'passenger.profile';
const APPEARANCE_KEY = 'passenger.appearance';

export type { Appearance };

type AppState = {
    service: RideService;
    /** False until the saved sign-in has been read, so the sign-in screen doesn't flash. */
    ready: boolean;
    profile?: Profile;
    signIn: (profile: Profile) => void;
    updateProfile: (profile: Profile) => Promise<void>;
    signOut: () => void;
    deleteAccount: () => Promise<void>;
    appearance: Appearance;
    setAppearance: (appearance: Appearance) => void;
    scheme: 'light' | 'dark';
    dropoff?: Place;
    setDropoff: (place: Place) => void;
    ride?: Ride;
    requestRide: (args: { pickup: Place; quote: Quote; payment: PaymentMethod }) => Promise<void>;
    cancelRide: () => Promise<void>;
    clearRide: () => void;
};

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const deviceScheme = useColorScheme();
    const [ready, setReady] = useState(false);
    const [profile, setProfile] = useState<Profile>();
    const [appearance, setAppearanceState] = useState<Appearance>(branding.appearance.defaultScheme);
    const [dropoff, setDropoff] = useState<Place>();
    const [ride, setRide] = useState<Ride>();

    useEffect(() => {
        AsyncStorage.multiGet([PROFILE_KEY, APPEARANCE_KEY])
            .then(([[, savedProfile], [, savedAppearance]]) => {
                if (savedProfile && sampleMode) {
                    setProfile(JSON.parse(savedProfile));
                }
                if (savedAppearance && branding.appearance.allowUserToggle) {
                    setAppearanceState(savedAppearance as Appearance);
                }
            })
            // Without saved data the rider signs in again, which is safe.
            .catch(() => {})
            .finally(() => setReady(true));
    }, []);

    const signIn = useCallback((next: Profile) => {
        setProfile(next);
        // A real session also needs its token kept, which belongs in secure storage (M2).
        // Until that exists, a Fleet-Ops sign-in lasts until the app closes.
        if (sampleMode) {
            AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next)).catch(() => {});
        }
    }, []);

    const updateProfile = useCallback(
        async (next: Profile) => {
            signIn(await service.updateProfile(next));
        },
        [signIn]
    );

    const signOut = useCallback(() => {
        setProfile(undefined);
        AsyncStorage.removeItem(PROFILE_KEY).catch(() => {});
    }, []);

    const deleteAccount = useCallback(async () => {
        await service.deleteAccount();
        signOut();
    }, [signOut]);

    const setAppearance = useCallback((next: Appearance) => {
        setAppearanceState(next);
        AsyncStorage.setItem(APPEARANCE_KEY, next).catch(() => {});
    }, []);

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

    const scheme = appearance === 'system' ? (deviceScheme === 'dark' ? 'dark' : 'light') : appearance;

    const value = useMemo<AppState>(
        () => ({
            service,
            ready,
            profile,
            signIn,
            updateProfile,
            signOut,
            deleteAccount,
            appearance,
            setAppearance,
            scheme,
            dropoff,
            setDropoff,
            ride,
            requestRide,
            cancelRide,
            clearRide: () => setRide(undefined),
        }),
        [ready, profile, signIn, updateProfile, signOut, deleteAccount, appearance, setAppearance, scheme, dropoff, ride, requestRide, cancelRide]
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
