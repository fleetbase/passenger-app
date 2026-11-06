import type React from 'react';
import { createLoadable } from './loadable';
import { isScreenId, SCREEN_IDS, type ScreenId } from './screen-ids';
import type { LoadableComponent, ResolvedScreen, ScreenEntry, ScreenOverrides, ScreenPlatform } from './types';

export type ScreenRegistryOptions = {
    /** Default implementation for every screen id. */
    defaults: Record<ScreenId, React.ComponentType<any>>;
    platform?: string;
    /** Throw on invalid overrides instead of warning and ignoring them (defaults to __DEV__). */
    strict?: boolean;
    warn?: (message: string) => void;
};

export type ScreenRegistry = {
    resolve: (id: ScreenId) => ResolvedScreen;
    preload: () => Promise<void>;
    hasOverride: (id: ScreenId) => boolean;
};

function isValidEntry(entry: unknown): entry is ScreenEntry<any> {
    if (!entry || typeof entry !== 'object') {
        return false;
    }
    const candidate = entry as ScreenEntry<any>;
    return typeof candidate.load === 'function' && (candidate.platforms === undefined || Array.isArray(candidate.platforms));
}

/**
 * Builds the screen registry from the default screens plus compiled-in overrides.
 * Invalid overrides throw in strict mode (development) and are otherwise ignored, so a
 * broken customization never replaces a working default screen. Defaults are plain
 * components because they share files, so only overrides load lazily.
 */
export function createScreenRegistry(overrides: ScreenOverrides, options: ScreenRegistryOptions): ScreenRegistry {
    const platform = options.platform ?? 'ios';
    const strict = options.strict ?? (typeof __DEV__ !== 'undefined' ? __DEV__ : false);
    const warn = options.warn ?? ((message: string) => console.warn(message));

    const reject = (message: string) => {
        if (strict) {
            throw new Error(message);
        }
        warn(message);
    };

    const accepted = new Map<ScreenId, LoadableComponent>();
    for (const [id, entry] of Object.entries(overrides ?? {})) {
        if (!isScreenId(id)) {
            reject(`[screen-registry] Unknown screen id "${id}". Known ids: ${SCREEN_IDS.join(', ')}`);
        } else if (!isValidEntry(entry)) {
            reject(`[screen-registry] Invalid override for "${id}": expected { load: () => import(...) }.`);
        } else if (!entry.platforms || entry.platforms.includes(platform as ScreenPlatform)) {
            accepted.set(id, createLoadable(entry.load as any, id));
        }
    }

    return {
        resolve: (id) => {
            const Default = options.defaults[id];
            if (!Default) {
                throw new Error(`[screen-registry] No default screen registered for "${id}".`);
            }
            const override = accepted.get(id);
            return override ? { Component: override, Default, source: 'override' } : { Component: Default, Default, source: 'default' };
        },
        preload: async () => {
            await Promise.all([...accepted.values()].map((component) => component.preload().catch(() => undefined)));
        },
        hasOverride: (id) => accepted.has(id),
    };
}
