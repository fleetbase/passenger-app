# Fleetbase Passenger

An open-source passenger app for ride-hailing, built on [Fleetbase](https://github.com/fleetbase/fleetbase) and Fleet-Ops. Taxi and private-hire operators rebrand it and publish it as their own app, so riders only see the operator's name. [Navigator](https://github.com/fleetbase/navigator-app) is the matching driver app.

It runs on iOS, Android and the web, from one React Native codebase.

> **Early development. Don't use it for real rides yet.** The whole ride runs on Fleet-Ops, but it has only been proven on the web build against a local Fleetbase. It hasn't been tried on a phone.

## Contents

- [What it does](#what-it-does)
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

**Not working yet:** push notifications. They need a push library and each operator's Firebase project, which the app doesn't have yet. Until then, the app follows the ride over the socket while it's open.

## What the server needs

- **Fleetbase with Fleet-Ops** from the `release/v0.7.0` line. The rider routes, timed offers and ride fields come from [fleetbase/fleetops#424](https://github.com/fleetbase/fleetops/pull/424), which isn't merged yet.
- **An API key with the `rider` profile,** so the key only reaches rider routes. Key profiles come from [fleetbase/core-api#329](https://github.com/fleetbase/core-api/pull/329), also not merged yet. Don't ship an unscoped key in a public app.
- **A ride order config** for the operator's company:

  ```bash
  php artisan fleetops:create-ride-config {company} --emergency-number=112 --support-phone="+1 555 0100" --support-email=help@example.com
  ```

  It makes riders' orders adhoc, matches them by vehicle type, offers them to one driver at a time for 20 seconds, and sets up the ride steps (en route, arrived, in trip, completed, no-show).
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

Android also needs a Google Maps key in `android/local.properties`:

```properties
GOOGLE_MAPS_API_KEY=your-key
```

### The web build

`yarn web` serves the app at http://localhost:8092 and proxies API requests to `PASSENGER_HOST`. `yarn web:build` writes a production build to `dist/`.

- A deployed site calls the API directly, so its address must be in the API's `FRONTEND_HOSTS`, or browsers block every request.
- The web build uses Leaflet in place of the native map, with OpenStreetMap tiles by default. OpenStreetMap's tile servers aren't meant for heavy production use, so set `webMapTiles` in the brand file before going live.

## Configuration

Settings are read from `.env` (or the environment) when the app is built, by `scripts/link-brand.js`. Restart Metro with `yarn start --reset-cache` after changing them.

| Setting | What it is |
|---|---|
| `PASSENGER_HOST` | Your Fleetbase API, for example `http://localhost:8000`. Android emulators reach this machine at `10.0.2.2`, and the app handles that. |
| `PASSENGER_KEY` | A public API key with the `rider` profile. |
| `PASSENGER_SAMPLE_DATA` | `true` runs on built-in sample data with no server. |

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

Each file is optional. A missing one falls back to the root template. Run `yarn brand:link` after adding or removing a file; `yarn install` and the bundlers run it too.

The native app name and identifier (`Passenger`, `io.fleetbase.passenger`) are the defaults. A store build for an operator sets its own when it's published.

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

Store builds aren't made here. Operators will publish their branded app through AppHelm, which doesn't support Passenger yet.

## License

[AGPL-3.0-or-later](LICENSE.md). Figtree is licensed under the [SIL Open Font License](assets/fonts/OFL.txt).
