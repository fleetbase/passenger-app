> v0.1.2 ~ "Built on Fleet-Ops' generic order configs"

---
## Highlights

- **No ride-only server code.** Fleet-Ops no longer has ride-specific endpoints or fields. The app now books an order config made from Fleet-Ops' `passenger` template. That config's flow, policies and triggers decide how trips are offered, priced, paid and announced.
- **Prices from Fleet-Ops' own pricing.** The total comes from the order's purchase rate, and the breakdown comes from the service quote it was bought at, including when the price is worked out again from the actual trip. A trip shows as paid when its transaction is settled.
- **Support number from the organization.** The operator's phone number now comes from their Fleetbase organization. The emergency number and a support email still come from the brand config.

## Changes

- New setting `FLEETBASE_ORDER_CONFIG`, which defaults to `passenger`: the order config the app books, and the only one it lists in trip history.
- The README's server setup uses `php artisan fleetops:create-order-config passenger --company={company}` in place of `fleetops:create-ride-config`.

## Upgrading

The server needs Fleet-Ops v0.7.0 with order config policies ([fleetbase/fleetops#426](https://github.com/fleetbase/fleetops/pull/426)). Ledger v0.1.0 is needed for card payments.

---
## Need help?
- [GitHub Discussions](https://github.com/fleetbase/fleetbase/discussions)
- [Discord](https://discord.gg/V7RVWRQ2Wm)
---
