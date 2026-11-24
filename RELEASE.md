> v0.1.6 ~ "Android, fixed"

---
## Highlights

- **The Android app works again.** v0.1.5 crashed on launch on Android. This release fixes that crash and three more Android problems found while capturing screenshots.

## Fixes (Android)

- **Crash on launch:** the notifications package is now built without the old `ReactNativeHost`, which React Native 0.86 no longer has.
- **Buttons hidden by the keyboard:** on Android 15 and later the window no longer shrinks for the keyboard. The sign-in, account, saved places and chat screens now move their content up themselves.
- **Startup crash without Firebase:** a build without a Firebase project no longer asks for a push token. With Firebase, the token reaches the app through React Native's new `ReactHost`.
- **No pickup position:** the app asks for the rider's position at high accuracy, so phones without network location still get a pickup.

## Changes

- **Screenshot flows:** `.maestro/screenshots/` has Maestro flows for Fleetbase's screenshot pipeline. They cover sign-in, account, booking and a whole trip.
- **Test IDs:** screens have `testID`s for those flows. Nothing visible changes.
- **Patch:** `patches/react-native-notifications+5.1.0.patch` holds the Firebase and `ReactHost` fixes. `patch-package` applies it on install.

## Upgrading

Run `yarn install` so the new patch is applied, then rebuild Android. iOS needs nothing.
