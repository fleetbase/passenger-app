import brandConfig from '../generated/brand-config';
import { hostedPreview } from '../preview/host';
import { resolveBranding } from './resolve';

/** The build's branding: brand/passenger.brand.ts, or the root template. A hosted preview's host can replace it. */
export const branding = resolveBranding(hostedPreview?.branding ?? brandConfig);

export const fontFace = (weight: keyof typeof branding.faces) => branding.faces[weight];
