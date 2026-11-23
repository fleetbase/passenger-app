# Screenshot flows

[Maestro](https://maestro.mobile.dev) flows that capture the app's screens on the iOS Simulator and the Android Emulator. Fleetbase's screenshot pipeline ([fleetbase/showcase](https://github.com/fleetbase/showcase), `passenger-app-screenshots.yml`) runs them against seeded demo data and proposes the images that changed to fleetbase.io. They live here so they change together with the screens they walk through.

A trip needs a driver, so the flows run one at a time, in order, and something plays the driver between them. In showcase that is `scripts/mobile/passenger-driver.py`, which takes the trip through the Fleetbase API the way Navigator would.

| Flow | Screens | Then the driver |
| --- | --- | --- |
| `01-sign-in.yaml` | sign-in, verification code, home | |
| `02-account.yaml` | account, trips, a past trip, its receipt, saved places, help | |
| `03-book.yaml` | drop-off, car classes and fares, "Finding your driver" | accepts |
| `04-en-route.yaml` | the driver on the way | arrives |
| `05-arrived.yaml` | the driver at the pickup | starts the trip |
| `06-in-progress.yaml` | on the way to the drop-off | completes it |
| `07-complete.yaml` | the final fare, the rating | |

`01-sign-in.yaml` starts the app from a clean state and signs out a rider the keychain kept. The others carry on from where the previous flow left the app.

## Running locally

1. Seed a Fleetbase with showcase's `./scripts/seed.sh` and `./scripts/seed.sh passenger`, with the stack started with `FLEETOPS_CUSTOMER_VERIFICATION_BYPASS_CODE` and `FLEETOPS_CUSTOMER_REVIEW_ACCOUNTS=+6591000301`.
2. Build a Release app (the JS must be bundled) with `FLEETBASE_HOST`, `FLEETBASE_API_KEY` and `FLEETBASE_ORDER_CONFIG` in `.env`, and install it on a booted simulator or emulator. Set the appearance there (`xcrun simctl ui booted appearance dark`, `adb shell cmd uimode night yes`).
3. Run the flows in order, with the driver's step after 03 to 06:

```bash
maestro test .maestro/screenshots/01-sign-in.yaml \
    -e APP_ID=io.fleetbase.passenger -e SHOT_SUFFIX= -e LATITUDE=1.28345 -e LONGITUDE=103.86072 \
    -e RIDER_PHONE=+6591000301 -e VERIFICATION_CODE=000000
```

showcase's `scripts/mobile/passenger-capture.sh` does all of it, for both appearances.

Screenshots are written to the working directory as `<shot>.png`, named by showcase's rule (`<area>-<subject>-<view>[-qualifier]`, e.g. `passenger-app-ride-details-en-route`); pass `-e SHOT_SUFFIX=-light` for the light appearance.

## Variables

Pass every one with `-e`. The flows declare no defaults, because a flow's own `env` takes precedence over the command line.

| Name | Example | Purpose |
| --- | --- | --- |
| `APP_ID` | `io.fleetbase.passenger` | Bundle id / application id |
| `SHOT_SUFFIX` | empty | Appended to every file name, e.g. `-light` |
| `LATITUDE`, `LONGITUDE` | Marina Bay Sands | Where the rider stands: the pickup, with drivers online nearby |
| `RIDER_PHONE` | `+6591000301` | The seeded rider |
| `VERIFICATION_CODE` | none | The server's `FLEETOPS_CUSTOMER_VERIFICATION_BYPASS_CODE`, accepted only for `FLEETOPS_CUSTOMER_REVIEW_ACCOUNTS` |

## Selectors

Flows select by `testID` only, never by text, so copy and language changes don't break them. Ids are kebab-case: `phone-number`, `home-where-to`, `request-ride`, `ride-en-route`, `trip-row`. When a screen changes, keep its ids, or update the flow in the same pull request.
