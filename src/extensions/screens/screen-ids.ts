/**
 * Every screen a build can override. These ids are a public contract: renaming or
 * removing one breaks client builds, so it belongs in the release notes.
 */
export const SCREEN_IDS = [
    'auth.signIn',
    'booking.home',
    'booking.destination',
    'booking.choose',
    'ride.active',
    'ride.chat',
    'ride.pay',
    'ride.rate',
    'account.home',
    'account.editProfile',
    'account.delete',
    'account.help',
    'trips.list',
    'trips.detail',
    'trips.receipt',
    'places.list',
    'places.edit',
] as const;

export type ScreenId = (typeof SCREEN_IDS)[number];

export const isScreenId = (id: string): id is ScreenId => (SCREEN_IDS as readonly string[]).includes(id);
