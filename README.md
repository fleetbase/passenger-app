<p align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="assets/brand/logo-dark.svg">
        <img src="assets/brand/logo.svg" alt="Passenger" height="72">
    </picture>
</p>

# Fleetbase Passenger

[![CI](https://github.com/fleetbase/passenger-app/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/fleetbase/passenger-app/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/fleetbase/passenger-app?label=release)](https://github.com/fleetbase/passenger-app/releases)
[![License: AGPL v3](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE.md)
![Platforms](https://img.shields.io/badge/platforms-iOS%20%7C%20Android%20%7C%20web-lightgrey)
![React Native](https://img.shields.io/badge/React%20Native-0.86-61dafb?logo=react)
[![Discord](https://img.shields.io/discord/699834923032248430?logo=discord&label=discord)](https://discord.gg/V7RVWRQ2Wm)

An open-source passenger app for ride-hailing, built on [Fleetbase](https://github.com/fleetbase/fleetbase) and Fleet-Ops. Taxi and private-hire operators rebrand it and publish it as their own app, so riders only see the operator's name. [Navigator](https://github.com/fleetbase/navigator-app) is the matching driver app.

It runs on iOS, Android and the web, from one React Native codebase.

<p align="center">
  <a href="https://apphelm.fleetbase.io/passenger?utm_source=github&utm_medium=readme&utm_campaign=launch&utm_content=passenger-app"><b>Launch with AppHelm</b></a> · <a href="https://fleetbase.io/platform/passenger">Passenger</a> · <a href="https://github.com/fleetbase/navigator-app">Navigator</a> · <a href="https://fleetbase.io/platform/fleetops">Fleet-Ops</a> · <a href="https://console.fleetbase.io">Console</a> · <a href="https://discord.gg/V7RVWRQ2Wm">Discord</a>
</p>

<p align="center">
  <img src="https://fleetbase.io/images/screenshots/passenger-app/ios/passenger-app-quotes-list.webp" width="240" alt="Choosing a car class: Standard and XL, each with seats, pickup time and an estimated fare" />
  <img src="https://fleetbase.io/images/screenshots/passenger-app/ios/passenger-app-ride-details-arrived.webp" width="240" alt="The driver has arrived: the driver's name, car and number plate, with buttons to cancel or message the driver" />
  <img src="https://fleetbase.io/images/screenshots/passenger-app/ios/passenger-app-fare-details.webp" width="240" alt="The final fare from the trip's actual distance and time, with its breakdown" />
</p>

## Launch your own app

<table>
  <tr>
    <td width="34%" valign="top">
      <a href="https://apphelm.fleetbase.io/passenger?utm_source=github&utm_medium=readme&utm_campaign=launch&utm_content=passenger-app"><img src="https://fleetbase.io/images/screenshots/passenger-app/ios/passenger-app-ride-details-en-route-light.webp" alt="The driver on the way in the light appearance: arriving in 3 minutes, with the driver's car and number plate" width="100%" /></a>
    </td>
    <td valign="top">

**The easiest way to launch Passenger is [Fleetbase AppHelm](https://apphelm.fleetbase.io/passenger?utm_source=github&utm_medium=readme&utm_campaign=launch&utm_content=passenger-app).** It takes your Fleetbase organization and publishes Passenger as your own branded app in the App Store and Google Play, with no code to write and no builds to run.

<p>
  <a href="https://apphelm.fleetbase.io/passenger?utm_source=github&utm_medium=readme&utm_campaign=launch&utm_content=passenger-app"><img src="https://img.shields.io/badge/Launch%20with%20AppHelm-1C6CC7?style=for-the-badge" alt="Launch with AppHelm" /></a>
</p>

1. **Connect** your Fleetbase organization with its public key, on Fleetbase Cloud or your own server.
2. **Add your brand** and try it in the live preview, with a sample trip in your city.
3. **Follow the checklist** to the App Store and Google Play: AppHelm takes the store screenshots, sets up App Review sign-in, and handles the builds and submission from your own Apple and Google accounts.

</td>
  </tr>
</table>

**Prefer to build it yourself?** Clone this repository, set your keys and build with your own tools and accounts. Start with [Getting started](#getting-started), then [Branding and custom screens](#branding-and-custom-screens).

> **Passenger is new.** Every trip runs on your Fleet-Ops. Try it with your own drivers on a test build (TestFlight and a Google Play internal test) before you open it to riders.

## Contents

- [Launch your own app](#launch-your-own-app)
- [What it does](#what-it-does)
- [Screenshots](#screenshots)
- [What the server needs](#what-the-server-needs)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Sample data](#sample-data)
- [Branding and custom screens](#branding-and-custom-screens)
- [How it's built](#how-its-built)
- [Development](#development)
- [Branches, commits and releases](#branches-commits-and-releases)
- [License](#license)

## What it does

| Part of the ride | How it works |
|---|---|
| Sign-in | Phone number and a texted code, then a name for new riders. |
| Booking | Pickup and drop-off by search, saved places or the map. Each car class shows a fare estimate, seats and pickup time. Cash or card. |
| Finding a driver | Offered to nearby drivers of the right vehicle type, one at a time, through Fleet-Ops adhoc dispatch. The rider sees when no driver is found. |
| The trip | The live car and ETA, the driver and plate, chat with the driver, a trip link to share and a safety screen that dials the emergency number. |
| After the trip | The final fare from the actual distance and time, with a breakdown, then cash to the driver or card through Ledger's hosted checkout. A rating for the driver. |
| Account | Trip history and receipts, saved places, appearance (if the operator allows it), help with the operator's contacts, and account deletion. |

## Screenshots

Every screen comes in light and dark. These are the iOS Simulator and the Android emulator, captured against a seeded Fleetbase.

**Booking**

| Sign-in | Home | Destination | Car classes | Finding a driver |
| :-: | :-: | :-: | :-: | :-: |
| <img src="https://fleetbase.io/images/screenshots/passenger-app/ios/passenger-app-login-create.webp" width="160" alt="Sign-in with a phone number" /> | <img src="https://fleetbase.io/images/screenshots/passenger-app/ios/passenger-app-booking-create.webp" width="160" alt="The home screen: the map, saved places and a Where to? search" /> | <img src="https://fleetbase.io/images/screenshots/passenger-app/ios/passenger-app-booking-create-destination.webp" width="160" alt="Choosing a drop-off from a search or saved places" /> | <img src="https://fleetbase.io/images/screenshots/passenger-app/ios/passenger-app-quotes-list.webp" width="160" alt="Car classes with seats, pickup time and an estimated fare" /> | <img src="https://fleetbase.io/images/screenshots/passenger-app/ios/passenger-app-ride-details-searching.webp" width="160" alt="Finding a driver: the request offered to nearby drivers" /> |

**The trip**

| On the way | Arrived | In the trip | Final fare | Rating |
| :-: | :-: | :-: | :-: | :-: |
| <img src="https://fleetbase.io/images/screenshots/passenger-app/ios/passenger-app-ride-details-en-route.webp" width="160" alt="The driver on the way, arriving in 1 minute" /> | <img src="https://fleetbase.io/images/screenshots/passenger-app/ios/passenger-app-ride-details-arrived.webp" width="160" alt="The driver has arrived, with the number plate to check" /> | <img src="https://fleetbase.io/images/screenshots/passenger-app/ios/passenger-app-ride-details-in-progress.webp" width="160" alt="The trip in progress, with share trip and safety" /> | <img src="https://fleetbase.io/images/screenshots/passenger-app/ios/passenger-app-fare-details.webp" width="160" alt="The final fare and its breakdown" /> | <img src="https://fleetbase.io/images/screenshots/passenger-app/ios/passenger-app-rating-create.webp" width="160" alt="Rating the driver" /> |

**After the trip**

| Trips | Trip | Receipt | Saved places | Account |
| :-: | :-: | :-: | :-: | :-: |
| <img src="https://fleetbase.io/images/screenshots/passenger-app/ios/passenger-app-trips-list.webp" width="160" alt="Past trips with their fares" /> | <img src="https://fleetbase.io/images/screenshots/passenger-app/ios/passenger-app-trip-details.webp" width="160" alt="A past trip on the map, with its distance, time and final fare" /> | <img src="https://fleetbase.io/images/screenshots/passenger-app/ios/passenger-app-receipt-details.webp" width="160" alt="A trip receipt" /> | <img src="https://fleetbase.io/images/screenshots/passenger-app/ios/passenger-app-places-list.webp" width="160" alt="Saved places" /> | <img src="https://fleetbase.io/images/screenshots/passenger-app/ios/passenger-app-account-details.webp" width="160" alt="The account screen" /> |

**On Android**

| Home | Car classes | Arrived | Final fare | Trips |
| :-: | :-: | :-: | :-: | :-: |
| <img src="https://fleetbase.io/images/screenshots/passenger-app/android/passenger-app-booking-create.webp" width="160" alt="The home screen on Android" /> | <img src="https://fleetbase.io/images/screenshots/passenger-app/android/passenger-app-quotes-list.webp" width="160" alt="Car classes on Android" /> | <img src="https://fleetbase.io/images/screenshots/passenger-app/android/passenger-app-ride-details-arrived.webp" width="160" alt="The driver has arrived, on Android" /> | <img src="https://fleetbase.io/images/screenshots/passenger-app/android/passenger-app-fare-details.webp" width="160" alt="The final fare on Android" /> | <img src="https://fleetbase.io/images/screenshots/passenger-app/android/passenger-app-trips-list.webp" width="160" alt="Past trips on Android" /> |

**Light appearance**

| Home | Car classes | On the way | Final fare | Help |
| :-: | :-: | :-: | :-: | :-: |
| <img src="https://fleetbase.io/images/screenshots/passenger-app/ios/passenger-app-booking-create-light.webp" width="160" alt="The home screen in the light appearance" /> | <img src="https://fleetbase.io/images/screenshots/passenger-app/ios/passenger-app-quotes-list-light.webp" width="160" alt="Car classes in the light appearance" /> | <img src="https://fleetbase.io/images/screenshots/passenger-app/ios/passenger-app-ride-details-en-route-light.webp" width="160" alt="The driver on the way in the light appearance" /> | <img src="https://fleetbase.io/images/screenshots/passenger-app/ios/passenger-app-fare-details-light.webp" width="160" alt="The final fare in the light appearance" /> | <img src="https://fleetbase.io/images/screenshots/passenger-app/ios/passenger-app-help-details-light.webp" width="160" alt="Help with the operator's contacts in the light appearance" /> |

## What the server needs

- **Fleetbase with Fleet-Ops v0.7.0 or later**, and v0.7.2 or later for the Passenger order config to be there without setup. The app uses Fleet-Ops' generic customer API. Everything ride-specific comes from an order config: its flow, policies, triggers and custom fields.
- **A Fleetbase API key** for the operator's company, from Developers → API Keys in the Console. The key is built into the app, so anyone who has the app can read it. Fleetbase can't yet limit what a key reaches; that will come with permissions and roles for API keys in IAM. Until then, don't publish a build to the public.
- **Fleet-Ops' Passenger order config.** From Fleet-Ops v0.7.2 every organization has it, next to Transport, and it can't be deleted. On Fleet-Ops v0.7.0 or v0.7.1, make it for the operator's company:

  ```bash
  php artisan fleetops:create-order-config passenger --company={company}
  ```

  It sets up the trip's steps: on the way, arrived, in trip, completed and no-show. Its policies cover the rest:
  - customers' orders are adhoc, offered to one driver at a time for 20 seconds, and matched by the vehicle type of the service they chose;
  - card trips must be paid before the next booking;
  - customers can cancel until the trip starts;
  - chat, rating and sharing are on;
  - the price is worked out again from the actual trip.

  Its triggers send the customer a push at each step and when the driver is about 400 m away. Change any of it in the Console's **Policies** and **Triggers** tabs. If the config's key isn't `passenger`, set `FLEETBASE_ORDER_CONFIG`.
- **The operator's phone number** on their organization. The app shows it as the support number. The emergency number and a support email come from the brand config.
- **Service rates** whose `service_type` matches the vehicles' `type`. Each one becomes a car class.
- **Ledger with a payment gateway** for card payments. For cash, turn on the cash gateway's `staff_confirm_only`, or riders can mark their own trip paid.
- **Drivers on Navigator,** online and with a vehicle.

## Getting started

You need Node 20 (see `.nvmrc`), Yarn 3 through Corepack, Xcode and Ruby 3.2 (see `.ruby-version`) for iOS, and Android Studio for Android. Bundler installs CocoaPods.

```bash
corepack enable
```

```bash
yarn install
```

```bash
cp .env.example .env
```

```bash
bundle install
```

```bash
cd ios && bundle exec pod install && cd ..
```

```bash
yarn start
```

Then, in another terminal, run one of these:

```bash
yarn ios
```

```bash
yarn android
```

```bash
yarn web
```

Android also needs a Google Maps key, in `android/local.properties` or `.env`:

```properties
GOOGLE_MAPS_API_KEY=your-key
```

### The web build

`yarn web` serves the app at http://localhost:8092 and proxies API requests to `FLEETBASE_HOST`. `yarn web:build` writes a production build to `dist/`.

- A deployed site calls the API directly, so its address must be in the API's `FRONTEND_HOSTS`, or browsers block every request.
- The web build uses Leaflet in place of the native map, with OpenStreetMap tiles by default. OpenStreetMap's tile servers aren't meant for heavy production use, so set `webMapTiles` in the brand file before going live.

### Hosted previews

A web build made with `PASSENGER_PREVIEW_ORIGIN` (comma-separated origins) runs as another site's preview, the way AppHelm shows an operator their app and takes its store screenshots. The host page sets `window.__PASSENGER_PREVIEW__` before the bundle loads:

```js
window.__PASSENGER_PREVIEW__ = {
    branding: { schemaVersion: 1, name: 'Bayline Taxi', colors: { light: { accent: '#0F766E' } } }, // a brand file's contents
    logo: '/brand/logo.png', // optional, and logoDark
    sample: { center: { latitude: 51.5072, longitude: -0.1276 }, currency: 'GBP' }, // where the sample places are, and the fares' currency
};
```

A hosted preview always runs on sample data and doesn't show the sample banner. Values it doesn't recognise are ignored. A build without `PASSENGER_PREVIEW_ORIGIN` never reads the global. See `src/preview/host.ts`.

## Configuration

Settings are read from `.env` (or the environment) when the app is built, by `scripts/link-brand.js`. Restart Metro with `yarn start --reset-cache` after changing them.

| Setting | What it is |
|---|---|
| `FLEETBASE_HOST` | Your Fleetbase API, for example `http://localhost:8000`. Android emulators reach this machine at `10.0.2.2`, and the app handles that. |
| `FLEETBASE_API_KEY` | The operator's Fleetbase API key, from Developers → API Keys in the Console. |
| `FLEETBASE_ORDER_CONFIG` | The key of the Fleet-Ops order config the app books. Defaults to `passenger`. |
| `FLEETBASE_PUSH_APP` | The app's push app key, from Fleet-Ops → Settings → Push Apps. Riders' pushes are then sent with your own Apple and Firebase keys. Leave it empty to use the push settings of the Fleetbase install. |
| `PASSENGER_SAMPLE_DATA` | `true` runs on built-in sample data with no server. |

A store build also sets these for Android, in the environment or `.env`. A local release build without an upload key is signed with the debug key.

| Setting | What it is |
|---|---|
| `APP_IDENTIFIER` | The application ID. Defaults to `io.fleetbase.passenger`. |
| `ANDROID_VERSION_CODE`, `ANDROID_VERSION_NAME` | The build number and version. |
| `ANDROID_UPLOAD_STORE_FILE`, `ANDROID_UPLOAD_STORE_PASSWORD`, `ANDROID_UPLOAD_KEY_ALIAS`, `ANDROID_UPLOAD_KEY_PASSWORD` | The upload key that signs the release build. |

### Push notifications

Riders get a push at each step of a trip, from the Passenger order config's triggers: driver on the way, driver arrived, trip started, trip completed, and when the driver is about 400 m away. The app asks for permission after sign-in and sends its push token to Fleet-Ops with `FLEETBASE_PUSH_APP`. Tapping a push opens the trip.

1. In the Console, add the app under **Fleet-Ops → Settings → Push Apps**:
   - **iOS:** an APNs key (.p8) from your Apple Developer account, with its key ID, your team ID and the app's bundle ID.
   - **Android:** the service account JSON of the app's Firebase project.
2. Set `FLEETBASE_PUSH_APP` to the push app's key.
3. For Android, put the Firebase project's `google-services.json` in `android/app` (git-ignored). Without it the app builds and runs, but doesn't register for pushes on Android.
4. For iOS, give the app the Push Notifications capability in your Apple Developer account. The project already has the entitlement and the remote-notification background mode.

Push needs Fleet-Ops v0.7.2 or later, with core-api v2.0.3. The web build doesn't receive pushes.

## Sample data

To try the full journey without a server, set `PASSENGER_SAMPLE_DATA=true`. A banner stays on screen while it's on.

- Any phone number, and any code of at least four digits, signs you in.
- A simulated driver accepts, drives to you and completes the trip.
- Trips and saved places reset when the app restarts.
- The card checkout, trip link and driver replies aren't real. No card is charged.

## Branding and custom screens

Don't edit the templates at the repository root. A client build keeps its own files in `brand/`, which this repository ignores, so pulling a new version never conflicts with them:

| File | What it changes |
|---|---|
| `brand/passenger.brand.ts` | Name, colours, fonts, appearance, contacts and emergency number. See [docs/branding.md](docs/branding.md). |
| `brand/passenger.extensions.ts` | Replaces screens and components, and adds routes. See [docs/extending.md](docs/extending.md). |
| `brand/fonts/` | Font files, named by their PostScript name. |
| `brand/logo.png`, `brand/logo-dark.png` | The logo, for light and dark mode. |
| `brand/app-icon.png` | The app icon, square and at least 1024×1024. `yarn generate:app-icon` makes every iOS and Android size from it. |

Each file is optional. A missing one falls back to the root template. Run `yarn brand:link` after adding or removing a file; `yarn install` and the bundlers run it too.

The native app name and identifier (`Passenger`, `io.fleetbase.passenger`), and the app icon, are the defaults. A store build for an operator sets its own when it's published.

To use your own icon, put it at `brand/app-icon.png` and run `yarn generate:app-icon` (it needs [ImageMagick](https://imagemagick.org)). It writes every size into `ios/PassengerApp/Images.xcassets/AppIcon.appiconset` and Android's `mipmap-*` folders, replacing Passenger's:
- **iOS:** transparency is filled with white, because the App Store refuses icons with it.
- **Android 8 and later:** the launcher masks the icon to a circle or rounded square, cutting about a sixth off each side, so keep the important part in the middle. The adaptive icon's background is the image's top-left colour.
- **Non-square images:** cropped to a square from the centre.

The command changes tracked files, so run it in your build, not in a clone you pull releases into.

The default icon and logo are in `assets/brand/`: `icon.svg` (the app icon), `icon-foreground.svg` (Android's adaptive icon layer, on Fleetbase blue `#4391EA`), and `logo.svg` and `logo-dark.svg` (for light and dark backgrounds). The iOS, Android and web icons are rendered from `icon.svg`.

## How it's built

React Native 0.86 with Tamagui, React Navigation 7 and `react-native-maps` (Apple Maps on iOS, Google Maps on Android), plus `react-native-web` and Leaflet for the web build. It talks to Fleetbase through `@fleetbase/sdk`.

```
src/
  screens/     sign-in, booking, ride, chat, trips, places, account
  services/    RideService (types.ts), Fleet-Ops (fleetbase.ts), sample data (stub.ts)
  state/       app state and the active ride
  ui/          shared components and the map
  branding/    brand loading and validation
  extensions/  screen and component overrides
  generated/   written by scripts/link-brand.js (ignored)
```

Screens only talk to the `RideService` interface in `src/services/types.ts`. `fleetbase.ts` implements it on Fleet-Ops, and `stub.ts` implements it on sample data, so a screen never knows which one it's using.

## Development

| Command | What it does |
|---|---|
| `yarn lint` | ESLint. |
| `yarn typecheck` | Links the brand files, then `tsc`. |
| `yarn test` | Jest. |
| `yarn web:build` | A production web build. |

CI runs all four on every pull request to `main`, then builds an Android debug APK and an iOS simulator app. Once the repository is public, a dependency review also fails a pull request that adds a dependency with a high-severity advisory.

## Branches, commits and releases

This follows the same conventions as the other Fleetbase repositories.

- **`main`** is the released code. Nothing is pushed to it directly.
- **Feature branches** are named `feat/…`, `fix/…`, `docs/…` and so on, and are merged into the open release branch, or into `main` when there isn't one.
- **Release branches** are named `release/v<version>`, for example `release/v0.1.0`. While one is open, new work goes there.
- **Commits** follow [Conventional Commits](https://www.conventionalcommits.org): `feat(rides): …`, `fix(booking): …`, `docs(readme): …`.
- **Versions** follow [semver](https://semver.org), starting at 0.x while the app is in early development.

**To release:**

1. On the release branch, set `version` in `package.json` to the release version.
2. Rewrite `RELEASE.md` for this release. Its first line must name the version (`> v0.1.0 ~ "Title"`), and the template's `RELEASE_NOTES_PLACEHOLDER` markers must be gone.
3. Open a pull request from `release/v<version>` to `main`, and merge it.

Merging runs `release.yml`, which checks that the branch name, `package.json` and `RELEASE.md` agree, then pushes the `v<version>` tag. The tag runs `create-release.yml`, which publishes the GitHub Release with `RELEASE.md` as its notes. If the tag step fails after a merge, run **Release Tag** by hand from the Actions tab with the version.

Store builds aren't made here. Operators publish their branded app through [AppHelm](https://apphelm.fleetbase.io/passenger?utm_source=github&utm_medium=readme&utm_campaign=launch&utm_content=passenger-app), or build it themselves.

## License

[AGPL-3.0-or-later](LICENSE.md). Figtree is licensed under the [SIL Open Font License](assets/fonts/OFL.txt).
