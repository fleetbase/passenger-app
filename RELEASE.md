> v0.1.4 ~ "Push notifications, checks on release branches, and no setup for the order config"

---
## Highlights

- **Push notifications.** Riders get a push at each step of a trip and when the driver is close, from the Passenger order config's triggers. After sign-in the app asks for permission and registers its push token with Fleet-Ops, with the build's push app key (`FLEETBASE_PUSH_APP`) so pushes go out with the operator's own Apple and Firebase keys. Tapping a push brings the trip back up. Needs Fleet-Ops v0.7.2 and core-api v2.0.3.
- **CI runs on pull requests into release branches.** Lint, typecheck, tests, the web build and the Android and iOS builds now run for pull requests into `release/v*` and `dev-v*` branches, not only `main`, as in Navigator.
- **The Passenger order config needs no setup from Fleet-Ops v0.7.2.** Every organization has it, so the server setup no longer asks you to run `fleetops:create-order-config passenger`. On Fleet-Ops v0.7.0 or v0.7.1 you still run it.

## Changes

- Adds `react-native-notifications` 5.1.0, patched to drop a `dexOptions` block Android Gradle Plugin 8 rejects.
- iOS: AppDelegate passes push events on, plus a bridging header, the `aps-environment` entitlement and the remote-notification background mode.
- Android: `POST_NOTIFICATIONS`, and the Google Services plugin when `android/app/google-services.json` is there. Without it the app doesn't register for pushes on Android.
- New setting `FLEETBASE_PUSH_APP`.
- `.github/workflows/ci.yml` runs on pull requests into `main`, `release/v*` and `dev-v*`.
- README and `.env.example` describe the Passenger config that Fleet-Ops creates.
- A code comment no longer points at a planning document outside the repository.

## Upgrading

Nothing to change.
