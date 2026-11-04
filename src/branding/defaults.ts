import type { BaseColors, BrandColors, BrandPreset, Scheme } from './schema';

export const baseColors: Record<Scheme, BaseColors> = {
    light: {
        background: '#EEF1F4',
        color: '#111827',
        surface: '#FFFFFF',
        raised: '#F3F5F7',
        text: '#111827',
        sub: '#4B5563',
        line: '#E5E7EB',
        danger: '#B42318',
        dangerBg: '#FDECEA',
        warnBg: '#FFF3C4',
        warnFg: '#5C4400',
        okBg: '#E3F6EA',
        okFg: '#14642F',
    },
    dark: {
        background: '#141922',
        color: '#F3F5F7',
        surface: '#1A2029',
        raised: '#252C37',
        text: '#F3F5F7',
        sub: '#AEB6C2',
        line: '#2F3744',
        danger: '#FF8A8A',
        dangerBg: '#3A1D20',
        warnBg: '#3A2F0A',
        warnFg: '#FFD54D',
        okBg: '#12321F',
        okFg: '#7BE0A3',
    },
};

export const brandPresets: Record<BrandPreset, Record<Scheme, BrandColors>> = {
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
