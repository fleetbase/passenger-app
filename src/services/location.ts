import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';
import { LocationUnavailableError } from './errors';
import type { Coordinate } from './types';

export async function currentPosition(): Promise<Coordinate> {
    if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            throw new LocationUnavailableError();
        }
    }
    // High accuracy: a pickup needs the rider's street, and without it Android asks only the
    // network-location provider, which some phones and every emulator lack, so no position came.
    return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
            ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
            () => reject(new LocationUnavailableError()),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        );
    });
}
