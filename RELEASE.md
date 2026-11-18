> v0.1.3 ~ "Ready for store builds on Android"

---
## Highlights

- **Android store builds set their own identity and key.** A release build reads its application ID, version and upload key from the build's settings, so a build machine such as AppHelm's can publish an operator's app under their own name without editing the project. Without an upload key, a local release build is still signed with the debug key.

## Changes

- `android/app/build.gradle` reads `APP_IDENTIFIER`, `ANDROID_VERSION_CODE`, `ANDROID_VERSION_NAME`, `GOOGLE_MAPS_API_KEY` and `ANDROID_UPLOAD_STORE_FILE`, `ANDROID_UPLOAD_STORE_PASSWORD`, `ANDROID_UPLOAD_KEY_ALIAS`, `ANDROID_UPLOAD_KEY_PASSWORD`: from the environment first, then `.env`, then `android/local.properties`.
- `GOOGLE_MAPS_API_KEY` can now also go in `.env`.

## Upgrading

Nothing to change. `GOOGLE_MAPS_API_KEY` in `android/local.properties` still works.

---
## Need help?
- [GitHub Discussions](https://github.com/fleetbase/fleetbase/discussions)
- [Discord](https://discord.gg/V7RVWRQ2Wm)
---
