import { config as baseConfig } from '@tamagui/config/v3';
import { Platform } from 'react-native';
import { createFont, createTamagui } from 'tamagui';
import { branding } from './src/branding';

const { faces } = branding;

// Browsers pick a face by family and weight: Figtree from web/fonts.css, and brand fonts from
// src/branding/fonts.web.ts under this family name. Native picks a face by its PostScript name.
const family = branding.usesBrandFonts ? 'PassengerBrand' : 'Figtree';

const body = createFont({
    ...baseConfig.fonts.body,
    // Browsers show the fallback until the font loads. Without one they'd use a serif.
    family: Platform.OS === 'web' ? `${family}, -apple-system, system-ui, sans-serif` : faces['400'],
    face: {
        400: { normal: faces['400'] },
        500: { normal: faces['500'] },
        600: { normal: faces['600'] },
        700: { normal: faces['700'] },
        800: { normal: faces['800'] },
    },
});

const config = createTamagui({
    ...baseConfig,
    fonts: { ...baseConfig.fonts, body, heading: body },
    themes: branding.themes,
});

export type AppConfig = typeof config;

declare module 'tamagui' {
    interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
