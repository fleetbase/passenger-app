# Custom screens and components

A build's extensions live in `brand/passenger.extensions.ts`. When that file exists, it's used in place of the root `passenger.extensions.ts`.

```ts
import { definePassengerExtensions } from '../src/extensions/define';

export default definePassengerExtensions({
    schemaVersion: 1,
    screens: { 'booking.home': { load: () => import('./screens/Home') } },
    components: { 'ride.driverCard': { load: () => import('./components/DriverCard') } },
    routes: { Rewards: { load: () => import('./screens/Rewards') } },
    accountLinks: [{ route: 'Rewards', label: 'Rewards', subtitle: 'Your points' }],
    onError: (error, { id, source }) => console.warn(id, source, error),
});
```

## Replacing a screen

An override receives the navigator's props plus `DefaultScreen`, so it can wrap the original rather than rebuild it:

```tsx
import type { PassengerScreenProps } from '../../src/extensions/screens/types';

export default function Home({ DefaultScreen, ...props }: PassengerScreenProps<'booking.home'>) {
    return <DefaultScreen {...props} />;
}
```

Screen ids are in `src/extensions/screens/screen-ids.ts`.

## Replacing a component

An override receives the component's props plus `Default`. Ids are in `src/extensions/components/component-ids.ts`, and props in `src/extensions/components/types.ts`.

## When something goes wrong

If an override fails to load or throws while rendering, the app shows the default instead and calls `onError`. An unknown id or malformed entry throws during development and is ignored with a warning in release builds. Ids and props are a public contract, so changes to them are listed in the release notes.
