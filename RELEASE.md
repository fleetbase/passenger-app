> v0.1.5 ~ "Your own app icon"

---
## Highlights

- **`yarn generate:app-icon` makes every icon size from one image.** Put a square image of at least 1024×1024 at `brand/app-icon.png` and run it: it writes the iOS icon set and Android's square, round and adaptive icons, so a store build ships the operator's icon instead of Passenger's. Fleetbase's build machines run it whenever a build has `brand/app-icon.png`.

## Changes

- New `scripts/generate-app-icon.js`. It uses ImageMagick (`magick`, or `convert` from ImageMagick 6) and adds no dependency.
  - **iOS icons** are opaque 24-bit PNGs: transparency is filled with white.
  - **Android's adaptive icon** uses the whole image as its foreground, on the image's top-left colour.
- **Tests:** a test makes the icons from a non-square image with a transparent corner. It's skipped where ImageMagick isn't installed.
- **README:** explains `brand/app-icon.png` and the command.

## Upgrading

Nothing to change. Without `brand/app-icon.png`, nothing changes: builds keep Passenger's icon.

