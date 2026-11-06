import brandExtensions from '../generated/brand-extensions';
import { EXTENSIONS_SCHEMA_VERSION, type PassengerExtensions } from './define';

let cached: PassengerExtensions | null = null;

/**
 * The build's extensions (brand/passenger.extensions.ts, or the root template). A file
 * written for a version this app doesn't know is ignored as a whole rather than half-applied.
 */
export function getBuildExtensions(): PassengerExtensions {
    if (cached) {
        return cached;
    }
    const value = (brandExtensions ?? {}) as PassengerExtensions;
    const version = value.schemaVersion ?? EXTENSIONS_SCHEMA_VERSION;
    if (version !== EXTENSIONS_SCHEMA_VERSION) {
        console.warn(`[extensions] passenger.extensions.ts has schemaVersion ${String(version)}; this app supports ${EXTENSIONS_SCHEMA_VERSION}. Ignoring it.`);
        cached = {};
    } else {
        cached = value;
    }
    return cached;
}
