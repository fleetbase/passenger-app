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
    return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
            ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
            () => reject(new LocationUnavailableError()),
            { timeout: 15000, maximumAge: 60000 }
        );
    });
}
