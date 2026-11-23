import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { branding } from '../branding';
import type { Appearance } from '../branding/schema';
import { createService, sampleMode } from '../services';
import { startPush } from '../services/push';
import type { PaymentMethod, Place, Profile, Quote, Ride, RideService, RideSettings } from '../services/types';

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
    /** Emergency and support contacts: the operator's settings, else the brand's. */
    contacts: { emergencyNumber: string; supportPhone?: string; supportEmail?: string };
};

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const deviceScheme = useColorScheme();
    const [ready, setReady] = useState(false);
    const [profile, setProfile] = useState<Profile>();
    const [appearance, setAppearanceState] = useState<Appearance>(branding.appearance.defaultScheme);
    const [dropoff, setDropoff] = useState<Place>();
    const [ride, setRide] = useState<Ride>();
    const [settings, setSettings] = useState<RideSettings>({});

    const signedIn = Boolean(profile);
    useEffect(() => {
        if (signedIn) {
            service.rideSettings().then(setSettings).catch(() => {});
            // A ride under way when the app closed is picked up again.
            service
                .activeRide(setRide)
                .then((active) => active && setRide((current) => current ?? active))
                .catch(() => {});
        }
    }, [signedIn]);

    // Pushes about the rider's trips: the token goes to Fleet-Ops once signed in, and a tapped
    // push brings the trip it is about back up.
    useEffect(() => {
        if (!signedIn || sampleMode) {
            return;
        }
        return startPush({
            onToken: (device) => {
                service.registerDevice(device).catch(() => {});
            },
            onOpen: () => {
                service
                    .activeRide(setRide)
                    .then((active) => active && setRide(active))
                    .catch(() => {});
            },
        });
    }, [signedIn]);

    const contacts = useMemo(
        () => ({
            emergencyNumber: settings.emergencyNumber ?? branding.emergencyNumber,
            supportPhone: settings.supportPhone ?? branding.support?.phone,
            supportEmail: settings.supportEmail ?? branding.support?.email,
        }),
        [settings]
    );

    useEffect(() => {
        service.onSessionExpired(() => setProfile(undefined));
        Promise.all([AsyncStorage.multiGet([PROFILE_KEY, APPEARANCE_KEY]), service.restoreSession(setProfile)])
            .then(([[[, savedProfile], [, savedAppearance]], restored]) => {
                if (restored) {
                    setProfile(restored);
                }
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
        // A real session is kept by the service, in the device's secure storage.
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
        service.signOut().catch(() => {});
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
            contacts,
        }),
        [ready, profile, signIn, updateProfile, signOut, deleteAccount, appearance, setAppearance, scheme, dropoff, ride, requestRide, cancelRide, contacts]
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
