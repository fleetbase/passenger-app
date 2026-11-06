import brandConfig from '../generated/brand-config';
import { resolveBranding } from './resolve';

/** The build's branding: brand/passenger.brand.ts, or the root template. */
export const branding = resolveBranding(brandConfig);

export const fontFace = (weight: keyof typeof branding.faces) => branding.faces[weight];
