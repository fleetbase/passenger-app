import { LocationUnavailableError } from './errors';
import type { Coordinate } from './types';

export function currentPosition(): Promise<Coordinate> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new LocationUnavailableError());
            return;
        }
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
            () => reject(new LocationUnavailableError()),
            { timeout: 15000, maximumAge: 60000 }
        );
    });
}
