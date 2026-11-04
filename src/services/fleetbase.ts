import Fleetbase from '@fleetbase/sdk';
import { Platform } from 'react-native';
import type { Profile, RideService } from './types';

export class NotConfiguredError extends Error {
    constructor() {
        super('This app has no Fleetbase server set. Set PASSENGER_HOST and PASSENGER_KEY in .env.');
    }
}

/** Thrown by the parts of the service that haven't been connected yet, so they fail visibly. */
export class NotConnectedError extends Error {
    constructor(method: string) {
        super(`${method} isn't connected to Fleet-Ops yet.`);
    }
}

type CustomerResource = { name?: string; phone?: string; email?: string };

const toProfile = (customer: CustomerResource, phone: string): Profile => {
    const [firstName = '', ...rest] = (customer.name ?? '').trim().split(/\s+/);
    return { firstName, lastName: rest.join(' '), phone: customer.phone ?? phone, email: customer.email || undefined };
};

const reachableHost = (host: string) => {
    // An Android emulator reaches the machine it runs on through this address.
    if (Platform.OS === 'android') {
        return host.replace(/\/\/(localhost|127\.0\.0\.1)/, '//10.0.2.2');
    }
    // `yarn web` proxies the API (webpack.config.js), because the API blocks other origins.
    return Platform.OS === 'web' && __DEV__ ? (globalThis as unknown as { location: { origin: string } }).location.origin : host;
};

/**
 * `RideService` on the Fleet-Ops API. Sign-in is connected; the rest is added milestone by
 * milestone (see ride-hailing/FLEETOPS-INTEGRATION-PLAN.md) and fails clearly until then.
 */
export function createFleetbaseService({ host, key }: { host: string; key: string }): RideService {
    const adapter = () => {
        if (!host || !key) {
            throw new NotConfiguredError();
        }
        return new Fleetbase(key, { host: reachableHost(host) }).getAdapter();
    };

    const notConnected = (method: string) => () => Promise.reject(new NotConnectedError(method));

    return {
        async requestCode(phone) {
            await adapter().post('customers/login-with-sms', { phone });
        },
        async verifyCode(phone, code) {
            const customer = (await adapter().post('customers/verify-code', { identity: phone, code })) as CustomerResource;
            return toProfile(customer, phone);
        },
        updateProfile: notConnected('updateProfile'),
        deleteAccount: notConnected('deleteAccount'),
        currentPickup: notConnected('currentPickup'),
        savedPlaces: notConnected('savedPlaces'),
        savePlace: notConnected('savePlace'),
        deletePlace: notConnected('deletePlace'),
        searchPlaces: notConnected('searchPlaces'),
        quotes: notConnected('quotes'),
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
        trips: notConnected('trips'),
        trip: notConnected('trip'),
    };
}
