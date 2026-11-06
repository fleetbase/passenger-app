> v0.1.0 ~ "First release: a full ride on Fleet-Ops, from sign-in to payment"

---
## Highlights

The first release of Passenger, an open-source rider app that taxi and private-hire operators rebrand and publish as their own. It runs on iOS, Android and the web, and the whole ride runs on Fleet-Ops.

This is an early development release. It has been proven on the web build against a local Fleetbase, not yet on a phone. Don't use it for real rides.

---
## What's in it

- **Sign-in** with a phone number and a texted code.
- **Booking** by search, saved places or the map, with a fare estimate, seats and pickup time for each car class, and cash or card.
- **Finding a driver** through Fleet-Ops adhoc dispatch, offered to nearby drivers of the right vehicle type one at a time. The rider sees when no driver is found.
- **The trip:** the live car and ETA, the driver and plate, chat with the driver, a trip link to share and a safety screen.
- **After the trip:** the final fare from the actual distance and time, cash or card through Ledger's hosted checkout, and a driver rating.
- **Account:** trip history and receipts, saved places, appearance, help and account deletion.
- **White-label branding** and screen overrides kept in `brand/`, so upgrades never conflict.
- **Sample data** to try the whole journey with no server.

---
## Needs

- Fleet-Ops with the rider routes and adhoc dispatch strategies from fleetbase/fleetops#424.
- Ledger with a payment gateway for card payments.
- A ride order config: `php artisan fleetops:create-ride-config {company}`.

---
## Known gaps

- No push notifications yet.
- The API key is built into the app and can't yet be limited to rider routes, so don't publish a build to the public.

---
## Need help?
- [GitHub Discussions](https://github.com/fleetbase/fleetbase/discussions)
- [Discord](https://discord.gg/V7RVWRQ2Wm)
