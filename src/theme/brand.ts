/**
 * Colours an operator's brand controls. `accent` fills buttons and `on` is the text on
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

export type BrandPreset = 'default' | 'yellow' | 'dark';

export type BrandConfig = {
    name: string;
    preset: BrandPreset;
    colors?: {
        light?: Partial<BrandColors>;
        dark?: Partial<BrandColors>;
    };
};

export const brandPresets: Record<BrandPreset, { light: BrandColors; dark: BrandColors }> = {
    default: {
        light: { accent: '#2E63D9', on: '#FFFFFF', route: '#2E63D9', ink: '#2E63D9', tint: '#E4ECFB', halo: 'rgba(46,99,217,0.20)' },
        dark: { accent: '#6C97F5', on: '#0B1017', route: '#8FB0F8', ink: '#A9C3FA', tint: '#1F2C45', halo: 'rgba(108,151,245,0.25)' },
    },
    yellow: {
        light: { accent: '#FFC400', on: '#111111', route: '#111111', ink: '#6B5000', tint: '#FFF3C4', halo: 'rgba(255,196,0,0.40)' },
        dark: { accent: '#FFC400', on: '#111111', route: '#FFC400', ink: '#FFD54D', tint: '#3A2F0A', halo: 'rgba(255,196,0,0.22)' },
    },
    dark: {
        light: { accent: '#14161B', on: '#FFFFFF', route: '#14161B', ink: '#14161B', tint: '#E5E7EB', halo: 'rgba(20,22,27,0.16)' },
        dark: { accent: '#F3F5F7', on: '#14161B', route: '#F3F5F7', ink: '#F3F5F7', tint: '#2F3744', halo: 'rgba(243,245,247,0.18)' },
    },
};
