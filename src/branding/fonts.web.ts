/// <reference lib="dom" />
import { brandFontFiles } from '../generated/brand-assets';
import { branding } from '.';

/** The family brand fonts are declared under, one face per weight. */
export const BRAND_FONT_FAMILY = 'PassengerBrand';

/** Browsers need each brand font declared before text can use it. */
export function registerBrandFonts() {
    if (!branding.usesBrandFonts) {
        return;
    }
    const rules = Object.entries(branding.faces).flatMap(([weight, name]) => {
        const file = brandFontFiles[name];
        if (!file) {
            console.warn(`[branding] Font "${name}" isn't in brand/fonts.`);
            return [];
        }
        return [`@font-face { font-family: '${BRAND_FONT_FAMILY}'; font-weight: ${weight}; src: url('${file}'); font-display: swap; }`, `@font-face { font-family: '${name}'; src: url('${file}'); font-display: swap; }`];
    });
    const style = document.createElement('style');
    style.textContent = rules.join('\n');
    document.head.appendChild(style);
}
