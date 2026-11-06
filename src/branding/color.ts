const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export const isHexColor = (value: unknown): value is string => typeof value === 'string' && HEX.test(value);

const channels = (hex: string) => {
    const full = hex.length === 4 ? hex.replace(/[0-9a-f]/gi, (digit) => digit + digit) : hex;
    return [1, 3, 5].map((start) => parseInt(full.slice(start, start + 2), 16) / 255);
};

const luminance = (hex: string) => {
    const [r, g, b] = channels(hex).map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG contrast ratio between two hex colours. */
export function contrastRatio(a: string, b: string) {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (light + 0.05) / (dark + 0.05);
}
