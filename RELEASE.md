> v0.1.7 ~ "Hosted previews"

---
## Highlights

- **Hosted previews.** A web build made with `PASSENGER_PREVIEW_ORIGIN` can run inside another site, such as AppHelm. The host page gives it the operator's brand and the area to show, through `window.__PASSENGER_PREVIEW__`. AppHelm uses this to show operators their app and to take their store screenshots.

## Changes

- **The host's brand:** a hosted preview's `branding`, `logo` and `logoDark` replace the build's brand file and logos.
- **Sample data anywhere:** the sample places sit around `sample.center`, so the map shows the operator's city, and sample fares are shown in `sample.currency`, scaled roughly for currencies like JPY or IDR. Without them, sample data is as before.
- **No banner in a hosted preview:** it always runs on sample data, and the host labels it.

## Upgrading

Nothing to do. Native builds, and web builds without `PASSENGER_PREVIEW_ORIGIN`, behave as before.
