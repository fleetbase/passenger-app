export const BRANDING_SCHEMA_VERSION = 1 as const;

export type Scheme = 'light' | 'dark';
export type Appearance = 'system' | Scheme;

/**
 * Colours a brand can set per scheme. `accent` fills buttons and `on` is the text on
 * them. `route` draws map lines, which is why it can differ from `accent`: yellow doesn't
 * show on a light map, so the yellow preset draws black lines there.
 */
export type BrandColors = {
    accent: string;
    on: string;
    route: string;
    ink: string;
    tint: string;
    halo: string;
};

export type BaseColors = {
    background: string;
    color: string;
    surface: string;
    raised: string;
    text: string;
    sub: string;
    line: string;
    danger: string;
    dangerBg: string;
    warnBg: string;
    warnFg: string;
    okBg: string;
    okFg: string;
};

export type ColorTokens = BrandColors & BaseColors;

export type BrandPreset = 'default' | 'yellow' | 'dark';

/** Font files by weight, named by PostScript name. Put the files in brand/fonts. */
export type FontFaces = Partial<Record<'400' | '500' | '600' | '700' | '800', string>>;

export type BrandingConfig = {
    /** Version of this shape. Omitted means 1. */
    schemaVersion?: typeof BRANDING_SCHEMA_VERSION;
    /** The operator's name, shown to riders. */
    name: string;
    /** Riders dial this from the safety screen during a trip. Set it for the operator's country. */
    emergencyNumber: string;
    /** A tested colour set. Defaults to `default`. */
    preset?: BrandPreset;
    /** Overrides for individual colours, per scheme. */
    colors?: {
        light?: Partial<ColorTokens>;
        dark?: Partial<ColorTokens>;
    };
    appearance?: {
        /** What a new install uses. Defaults to `system`. */
        defaultScheme?: Appearance;
        /** Whether riders can change it on the account screen. Defaults to true. */
        allowUserToggle?: boolean;
    };
    typography?: {
        /** Replaces Figtree. Missing weights use the nearest one given. */
        faces?: FontFaces;
    };
    /** Corner radius of cards and sheets. Defaults to 28. */
    radius?: number;
    /** Shown on the help screen. Anything left out is hidden. */
    support?: {
        phone?: string;
        email?: string;
        termsUrl?: string;
    };
    /** Map tiles for the web build. Defaults to OpenStreetMap, which isn't meant for heavy production use. */
    webMapTiles?: {
        url: string;
        attribution: string;
    };
};
