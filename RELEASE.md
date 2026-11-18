> v0.1.4 ~ "Checks on release branches, and no setup for the order config"

---
## Highlights

- **CI runs on pull requests into release branches.** Lint, typecheck, tests, the web build and the Android and iOS builds now run for pull requests into `release/v*` and `dev-v*` branches, not only `main`, as in Navigator.
- **The Passenger order config needs no setup from Fleet-Ops v0.7.2.** Every organization has it, so the server setup no longer asks you to run `fleetops:create-order-config passenger`. On Fleet-Ops v0.7.0 or v0.7.1 you still run it.

## Changes

- `.github/workflows/ci.yml` runs on pull requests into `main`, `release/v*` and `dev-v*`.
- README and `.env.example` describe the Passenger config that Fleet-Ops creates.
- A code comment no longer points at a planning document outside the repository.

## Upgrading

Nothing to change.
