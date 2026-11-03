import { config as baseConfig } from '@tamagui/config/v3';
import { createFont, createTamagui } from 'tamagui';
import brand from './passenger.brand';
import { brandPresets } from './src/theme/brand';

const base = {
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

const preset = brandPresets[brand.preset];

const figtree = createFont({
    ...baseConfig.fonts.body,
    family: 'Figtree',
    face: {
        400: { normal: 'Figtree-Regular' },
        500: { normal: 'Figtree-Medium' },
        600: { normal: 'Figtree-SemiBold' },
        700: { normal: 'Figtree-Bold' },
        800: { normal: 'Figtree-ExtraBold' },
    },
});

const config = createTamagui({
    ...baseConfig,
    fonts: { ...baseConfig.fonts, body: figtree, heading: figtree },
    themes: {
        light: { ...base.light, ...preset.light, ...brand.colors?.light },
        dark: { ...base.dark, ...preset.dark, ...brand.colors?.dark },
    },
});

export type AppConfig = typeof config;

declare module 'tamagui' {
    interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
