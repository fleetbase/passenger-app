# Fleetbase Passenger

An open-source passenger app for ride-hailing, built on [Fleetbase](https://github.com/fleetbase/fleetbase) and Fleet-Ops. Taxi and private-hire operators rebrand it and publish it as their own app, so riders only see the operator's name. [Navigator](https://github.com/fleetbase/navigator-app) is the matching driver app.

## Status

**Early development: the whole ride runs on Fleet-Ops, but it hasn't been tried on a phone yet.** Sign-in, booking, timed offers to drivers, the live car and ETA, chat with the driver, sharing a trip, the final fare from the actual trip, card or cash payment through Ledger, ratings and account deletion use the real API. Proven on the web build against a local Fleetbase only. Push notifications need a push library and each operator's Firebase project, which the app doesn't have yet. The plan is in `ride-hailing/FLEETOPS-INTEGRATION-PLAN.md` in the Fleetbase workspace. Don't use this for real rides.

The server needs a ride order config (`php artisan fleetops:create-ride-config {company}`), which makes riders' orders adhoc, matched by vehicle type and offered to one driver at a time. It also needs service rates whose `service_type` matches the vehicles' `type`, and Ledger with a payment gateway. For cash, turn on the cash gateway's `staff_confirm_only`, or riders can mark their own trip paid.

To try the full journey without a server, set `PASSENGER_SAMPLE_DATA=true` in `.env`. It uses a simulated driver, and a banner stays on screen. On sample data, trips and saved places reset when the app restarts, and the card checkout, trip link and driver replies aren't real. No card is charged.

## Getting started

You need Node 20, Yarn (through Corepack), Xcode with CocoaPods, and Android Studio for Android.

```bash
corepack enable
yarn install
cp .env.example .env
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

For the web build:

```bash
yarn web
```

This serves the app at http://localhost:8092 and proxies API requests to `PASSENGER_HOST`. A deployed site calls the API directly, so its address must be in the API's `FRONTEND_HOSTS`, or browsers will block every request. `yarn web:build` writes a production build to `dist/`. The web build uses Leaflet in place of the native map, with OpenStreetMap tiles by default. OpenStreetMap's tile servers aren't meant for heavy production use, so set `webMapTiles` in `passenger.brand.ts` before going live.

Set `PASSENGER_HOST` and `PASSENGER_KEY` in `.env`, using an API key with the `rider` profile, then restart Metro with `yarn start --reset-cache`. On sample data, any phone number and any code of at least four digits signs you in.

## Branding and custom screens

Don't edit the templates at the repository root. A client build keeps its files in `brand/`, which this repository ignores, so upgrades never conflict:

- `brand/passenger.brand.ts`: name, colours, fonts, appearance, contacts and emergency number. See [docs/branding.md](docs/branding.md).
- `brand/passenger.extensions.ts`: replaces screens and components, and adds routes. See [docs/extending.md](docs/extending.md).

## Connecting a backend

Screens only talk to the `RideService` interface in `src/services/types.ts`. `src/services/fleetbase.ts` implements it on Fleet-Ops, and `src/services/stub.ts` is the sample data.

## License

[AGPL-3.0-or-later](LICENSE.md). Figtree is licensed under the [SIL Open Font License](assets/fonts/OFL.txt).
