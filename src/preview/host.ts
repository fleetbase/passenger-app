/**
 * Hosted preview mode, for web builds that run inside another site's iframe, such as AppHelm's
 * brand preview and its store screenshots. It is off unless the bundle was built with
 * PASSENGER_PREVIEW_ORIGIN: the origins, comma separated, allowed to host the preview.
 *
 * Before the bundle loads, the host page sets `window.__PASSENGER_PREVIEW__` to:
 *
 *   {
 *     branding: { ...a brand file's contents },        // replaces passenger.brand.ts
 *     logo: 'https://…/logo.png', logoDark: '…',      // optional, replace brand/logo*.png
 *     sample: { center: { latitude, longitude },       // where the sample places are
 *               currency: 'GBP' },                     // how sample fares are shown
 *   }
 *
 * A hosted preview always runs on sample data, with no server, and doesn't show the sample
 * banner: the host says it's a preview. Native builds, and web builds without the flag, behave
 * exactly as before.
 */
import type { BrandingConfig } from '../branding/schema';
import type { Coordinate } from '../services/types';

declare const __PREVIEW_ORIGIN__: string | undefined;

export type SampleArea = { center?: Coordinate; currency?: string };

export type HostedPreview = {
    branding?: BrandingConfig;
    logo?: string;
    logoDark?: string;
    sample: SampleArea;
};

export function parseOrigins(value: string | undefined): string[] {
    return (value ?? '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
}

const isCoordinate = (value: unknown): value is Coordinate => {
    const point = value as Coordinate | undefined;
    return (
        !!point &&
        typeof point.latitude === 'number' &&
        typeof point.longitude === 'number' &&
        Math.abs(point.latitude) <= 90 &&
        Math.abs(point.longitude) <= 180
    );
};

const isUrl = (value: unknown): value is string => typeof value === 'string' && /^(https?:\/\/|\/)/.test(value);

/** Keeps only the shapes it knows, so a malformed host page can't inject anything else. */
export function readHostedPreview(raw: unknown): HostedPreview | null {
    if (!raw || typeof raw !== 'object') {
        return null;
    }
    const { branding, logo, logoDark, sample } = raw as Record<string, unknown>;
    const area = (sample ?? {}) as Record<string, unknown>;
    return {
        branding: branding && typeof branding === 'object' ? (branding as BrandingConfig) : undefined,
        logo: isUrl(logo) ? logo : undefined,
        logoDark: isUrl(logoDark) ? logoDark : undefined,
        sample: {
            center: isCoordinate(area.center) ? area.center : undefined,
            currency: typeof area.currency === 'string' && /^[A-Z]{3}$/.test(area.currency) ? area.currency : undefined,
        },
    };
}

export function createHostedPreview({ origins, target }: { origins: string[]; target?: { __PASSENGER_PREVIEW__?: unknown } }) {
    const enabled = origins.length > 0 && !!target;
    return { enabled, initial: enabled ? (readHostedPreview(target!.__PASSENGER_PREVIEW__) ?? { sample: {} }) : null };
}

const hosted = createHostedPreview({
    origins: parseOrigins(typeof __PREVIEW_ORIGIN__ === 'string' ? __PREVIEW_ORIGIN__ : undefined),
    target: typeof window !== 'undefined' ? (window as unknown as { __PASSENGER_PREVIEW__?: unknown }) : undefined,
});

/** A web build running as another site's preview: sample data, the host's brand, no banner. */
export const isHostedPreview = hosted.enabled;
export const hostedPreview = hosted.initial;
