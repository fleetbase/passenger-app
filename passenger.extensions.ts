import { definePassengerExtensions } from './src/extensions/define';

/**
 * Template for a build's extensions. Don't customize this file: a client build puts its
 * own at brand/passenger.extensions.ts, which is used instead when it exists, so upgrading
 * never conflicts with your changes. See docs/extending.md.
 *
 * Example (brand/passenger.extensions.ts):
 *
 *   import { definePassengerExtensions } from '../src/extensions/define';
 *
 *   export default definePassengerExtensions({
 *       schemaVersion: 1,
 *       screens: { 'booking.home': { load: () => import('./screens/Home') } },
 *       components: { 'ride.driverCard': { load: () => import('./components/DriverCard') } },
 *       routes: { Rewards: { load: () => import('./screens/Rewards') } },
 *       accountLinks: [{ route: 'Rewards', label: 'Rewards' }],
 *   });
 */
export default definePassengerExtensions({ schemaVersion: 1 });
