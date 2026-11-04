import { contrastRatio, isHexColor } from './color';
import { baseColors, brandPresets } from './defaults';
import { BRANDING_SCHEMA_VERSION, type Appearance, type BrandingConfig, type BrandPreset, type ColorTokens, type FontFaces, type Scheme } from './schema';

const FIGTREE: Required<FontFaces> = {
    '400': 'Figtree-Regular',
    '500': 'Figtree-Medium',
    '600': 'Figtree-SemiBold',
    '700': 'Figtree-Bold',
    '800': 'Figtree-ExtraBold',
};

const WEIGHTS = ['400', '500', '600', '700', '800'] as const;

/** The contrast WCAG AA asks of normal text. */
const MIN_CONTRAST = 4.5;

export type ResolvedBranding = {
    name: string;
    emergencyNumber: string;
    themes: Record<Scheme, ColorTokens>;
    appearance: { defaultScheme: Appearance; allowUserToggle: boolean };
    faces: Required<FontFaces>;
    usesBrandFonts: boolean;
    radius: number;
    support: NonNullable<BrandingConfig['support']>;
    webMapTiles?: BrandingConfig['webMapTiles'];
};

/** Fills in missing weights from the nearest one given, so every weight has a face. */
function completeFaces(faces: FontFaces): Required<FontFaces> {
    const given = WEIGHTS.filter((weight) => faces[weight]);
    if (given.length === 0) {
        return FIGTREE;
    }
    const nearest = (weight: number) => given.reduce((best, candidate) => (Math.abs(Number(candidate) - weight) < Math.abs(Number(best) - weight) ? candidate : best));
    return Object.fromEntries(WEIGHTS.map((weight) => [weight, faces[weight] ?? faces[nearest(Number(weight))]])) as Required<FontFaces>;
}

/**
 * Turns a brand file into what the app uses. A bad value is reported and ignored, so a
 * typo in branding can't stop a build from starting or make buttons unreadable.
 */
export function resolveBranding(config: BrandingConfig, warn: (message: string) => void = console.warn): ResolvedBranding {
    const version = config.schemaVersion ?? BRANDING_SCHEMA_VERSION;
    if (version !== BRANDING_SCHEMA_VERSION) {
        warn(`[branding] Brand file has schemaVersion ${String(version)}; this app supports ${BRANDING_SCHEMA_VERSION}. Its newer settings may be ignored.`);
    }

    let preset: BrandPreset = config.preset ?? 'default';
    if (!brandPresets[preset]) {
        warn(`[branding] Unknown preset "${String(preset)}"; using "default".`);
        preset = 'default';
    }

    const theme = (scheme: Scheme): ColorTokens => {
        const tokens: ColorTokens = { ...baseColors[scheme], ...brandPresets[preset][scheme] };
        for (const [key, value] of Object.entries(config.colors?.[scheme] ?? {})) {
            if (!(key in tokens)) {
                warn(`[branding] Unknown colour "${key}" for ${scheme}; ignoring it.`);
            } else if (key === 'halo' ? typeof value !== 'string' : !isHexColor(value)) {
                warn(`[branding] Colour "${key}" for ${scheme} isn't a hex colour; ignoring it.`);
            } else {
                tokens[key as keyof ColorTokens] = value as string;
            }
        }
        // Buttons must stay readable, so an unreadable pair goes back to the preset's.
        if (contrastRatio(tokens.accent, tokens.on) < MIN_CONTRAST) {
            warn(`[branding] "accent" and "on" have too little contrast for ${scheme}; using the "${preset}" preset's pair.`);
            tokens.accent = brandPresets[preset][scheme].accent;
            tokens.on = brandPresets[preset][scheme].on;
        }
        return tokens;
    };

    return {
        name: config.name,
        emergencyNumber: config.emergencyNumber,
        themes: { light: theme('light'), dark: theme('dark') },
        appearance: { defaultScheme: config.appearance?.defaultScheme ?? 'system', allowUserToggle: config.appearance?.allowUserToggle ?? true },
        faces: completeFaces(config.typography?.faces ?? {}),
        usesBrandFonts: Object.keys(config.typography?.faces ?? {}).length > 0,
        radius: config.radius ?? 28,
        support: config.support ?? {},
        webMapTiles: config.webMapTiles,
    };
}
