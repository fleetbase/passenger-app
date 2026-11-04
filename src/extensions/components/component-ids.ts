/**
 * Every component a build can override. Like screen ids, these and their props are a
 * public contract, so changes belong in the release notes.
 */
export const COMPONENT_IDS = ['ride.driverCard', 'booking.classCard', 'trips.row'] as const;

export type ComponentId = (typeof COMPONENT_IDS)[number];

export const isComponentId = (id: string): id is ComponentId => (COMPONENT_IDS as readonly string[]).includes(id);
