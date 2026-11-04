# Branding

A build's branding lives in `brand/passenger.brand.ts`. When that file exists, it's used in place of the root `passenger.brand.ts`.

```ts
import { defineBranding } from '../src/branding/define';

export default defineBranding({
    schemaVersion: 1,
    name: 'Bayline Taxi',
    emergencyNumber: '999',
    preset: 'yellow',
    colors: { light: { surface: '#FFFDF5' }, dark: { surface: '#17140A' } },
    appearance: { defaultScheme: 'light', allowUserToggle: false },
    typography: { faces: { '400': 'Inter-Regular', '600': 'Inter-SemiBold', '700': 'Inter-Bold' } },
    radius: 20,
    support: { phone: '+65 6000 0000', email: 'help@bayline.example', termsUrl: 'https://bayline.example/terms' },
});
```

`name` and `emergencyNumber` are required. The safety screen dials `emergencyNumber`, so set it for the operator's country.

## Colours

`preset` is `default`, `yellow` or `dark`. `colors` overrides individual tokens per scheme: `accent`, `on`, `route`, `ink`, `tint`, `halo`, `background`, `color`, `surface`, `raised`, `text`, `sub`, `line`, `danger`, `dangerBg`, `warnBg`, `warnFg`, `okBg`, `okFg`.

Values must be hex, apart from `halo`. An invalid value is ignored with a warning. If `accent` and `on` have less than 4.5:1 contrast, the app goes back to the preset's pair.

## Fonts

Put the files in `brand/fonts`, named by PostScript name (for example `Inter-Bold.ttf`), and list them by weight in `typography.faces`. A missing weight uses the nearest one given. On iOS and Android, link the files with `npx react-native-asset`, then rebuild.

## Logo

`brand/logo.png` replaces the operator's name on the sign-in and home screens. `brand/logo-dark.png` is used in dark mode if it exists.

## After changing a brand file

Restart Metro with `yarn start --reset-cache`. For the web build, restart `yarn web`.
