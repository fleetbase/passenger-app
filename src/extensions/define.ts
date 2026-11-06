/**
 * The shape of a build's extensions file, and the helper that type-checks it. Types only,
 * because brand/passenger.extensions.ts imports it while the app is still loading its
 * own modules.
 */
import type React from 'react';
import type { ComponentOverrides } from './components/types';
import type { ScreenErrorReporter, ScreenOverrides, ScreenPlatform } from './screens/types';

export const EXTENSIONS_SCHEMA_VERSION = 1 as const;

export type CustomRoute = {
    /** Loads the screen. Use `() => import('./screens/Rewards')`. */
    load: () => Promise<{ default: React.ComponentType<any> }>;
    /** Restrict the route to some platforms. */
    platforms?: ScreenPlatform[];
};

export type AccountLink = {
    /** The route the entry opens: a custom route or a core one. */
    route: string;
    label: string;
    subtitle?: string;
};

export type PassengerExtensions = {
    /** Version of this shape. Omitted means 1; a version the app doesn't know is ignored with a warning. */
    schemaVersion?: typeof EXTENSIONS_SCHEMA_VERSION;
    /** Screen overrides keyed by stable screen id. */
    screens?: ScreenOverrides;
    /** Component overrides keyed by stable component id. */
    components?: ComponentOverrides;
    /** Screens the build adds, by route name; open them with navigation.navigate(name). */
    routes?: Record<string, CustomRoute>;
    /** Entries the build adds to the account screen. */
    accountLinks?: AccountLink[];
    /** Receives every screen or component failure the app recovered from. */
    onError?: ScreenErrorReporter;
};

/** Identity helper that type-checks a build's extensions. */
export function definePassengerExtensions(extensions: PassengerExtensions): PassengerExtensions {
    return extensions;
}
