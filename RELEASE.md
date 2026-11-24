> v0.1.8 ~ "iPhone only"

---
## Highlights

- **The iOS app is iPhone only, like Storefront.** It was built for iPhone and iPad, so App Store Connect asked for iPad icons and would have asked for iPad screenshots too. It refused AppHelm's first Passenger upload for the missing 167×167 iPad Pro icon. On an iPad, riders can still install it and run it as an iPhone app.

## Changes

- `TARGETED_DEVICE_FAMILY` is `1` (iPhone) in both build configurations.
- `Info.plist` no longer lists iPad orientations.

## Upgrading

Nothing to do. An operator who wants an iPad app can set the device family back in Xcode, and needs iPad icons and screenshots of their own.
