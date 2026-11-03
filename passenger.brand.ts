import type { BrandConfig } from './src/theme/brand';

/**
 * The operator's branding. An operator's build replaces these values, so riders only
 * ever see the operator's name, colours and logo. `preset` picks a tested colour set;
 * `colors` overrides individual tokens per scheme.
 *
 * Example:
 *
 *     export default { name: 'Bayline Taxi', preset: 'yellow' } satisfies BrandConfig;
 */
const brand: BrandConfig = {
    name: 'Passenger',
    preset: 'default',
};

export default brand;
