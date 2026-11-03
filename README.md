# Fleetbase Passenger

An open-source passenger app for ride-hailing, built on [Fleetbase](https://github.com/fleetbase/fleetbase) and Fleet-Ops. Taxi and private-hire operators rebrand it and publish it as their own app, so riders only see the operator's name. [Navigator](https://github.com/fleetbase/navigator-app) is the matching driver app.

## Status

Early development. The main journey runs on sample data through a stub service (`src/services/stub.ts`), including a simulated driver. It doesn't connect to a Fleetbase backend yet, because the Fleet-Ops rider API isn't built. Don't use this for real rides.

Working on the stub:

- Phone sign-in
- Home, destination search and choosing a car class
- Finding a driver, driver on the way, driver arrived and in trip
- Final fare, cash or card payment, and rating

## Getting started

You need Node 20, Yarn (through Corepack), Xcode with CocoaPods, and Android Studio for Android.

```bash
corepack enable
yarn install
cd ios && pod install && cd ..
yarn start
```

In another terminal:

```bash
yarn ios
```

Android also needs a Google Maps key in `android/local.properties`:

```properties
GOOGLE_MAPS_API_KEY=your-key
```

```bash
yarn android
```

Enter any phone number and any code of at least four digits to sign in on the stub.

## Branding

Edit `passenger.brand.ts` to set the operator's name and colours. Presets are `default`, `yellow` and `dark`, and `colors` overrides individual tokens for the light and dark themes. Restart Metro with `yarn start --reset-cache` after changing it.

## Connecting a backend

Screens only talk to the `RideService` interface in `src/services/types.ts`. A Fleetbase implementation will replace `createStubService()` in `src/state/AppContext.tsx`.

## License

[AGPL-3.0-or-later](LICENSE.md). Figtree is licensed under the [SIL Open Font License](assets/fonts/OFL.txt).
