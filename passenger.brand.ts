import { defineBranding } from './src/branding/define';

/**
 * Template for a build's branding. Don't customize this file: a client build puts its own
 * at brand/passenger.brand.ts, which is used instead when it exists, so upgrading never
 * conflicts with your changes. See docs/branding.md.
 *
 * Example (brand/passenger.brand.ts):
 *
 *   import { defineBranding } from '../src/branding/define';
 *
 *   export default defineBranding({
 *       schemaVersion: 1,
 *       name: 'Bayline Taxi',
 *       emergencyNumber: '999',
 *       preset: 'yellow',
 *       colors: { light: { surface: '#FFFDF5' } },
 *       appearance: { defaultScheme: 'light', allowUserToggle: false },
 *       typography: { faces: { '400': 'Inter-Regular', '700': 'Inter-Bold' } },
 *       support: { phone: '+65 6000 0000', email: 'help@bayline.example' },
 *   });
 */
export default defineBranding({
    schemaVersion: 1,
    name: 'Passenger',
    // The safety screen dials this, so a real build must set it for the operator's country.
    emergencyNumber: '112',
    support: {
        phone: '+1 555 0100',
        email: 'support@example.com',
        termsUrl: 'https://example.com/terms',
    },
});
