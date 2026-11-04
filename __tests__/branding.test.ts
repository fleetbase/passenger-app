import { contrastRatio } from '../src/branding/color';
import { resolveBranding } from '../src/branding/resolve';

const base = { name: 'Bayline', emergencyNumber: '999' };

test('a minimal brand file gets the default preset and Figtree', () => {
    const resolved = resolveBranding(base, jest.fn());
    expect(resolved.themes.light.accent).toBe('#2E63D9');
    expect(resolved.faces['700']).toBe('Figtree-Bold');
    expect(resolved.appearance).toEqual({ defaultScheme: 'system', allowUserToggle: true });
});

test('colour overrides reach base tokens as well as brand tokens, per scheme', () => {
    const resolved = resolveBranding({ ...base, preset: 'yellow', colors: { light: { surface: '#FFFDF5' } } }, jest.fn());
    expect(resolved.themes.light.surface).toBe('#FFFDF5');
    expect(resolved.themes.dark.surface).toBe('#1A2029');
    expect(resolved.themes.light.accent).toBe('#FFC400');
});

test('bad values are reported and ignored', () => {
    const warn = jest.fn();
    const resolved = resolveBranding({ ...base, preset: 'neon' as never, colors: { light: { surface: 'white', nope: '#000000' } as never } }, warn);
    expect(warn).toHaveBeenCalledTimes(3);
    expect(resolved.themes.light.surface).toBe('#FFFFFF');
    expect(resolved.themes.light.accent).toBe('#2E63D9');
});

test('an unreadable accent and on pair goes back to the preset', () => {
    const warn = jest.fn();
    const resolved = resolveBranding({ ...base, colors: { light: { accent: '#FFFFFF', on: '#FFFFEE' } } }, warn);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(contrastRatio(resolved.themes.light.accent, resolved.themes.light.on)).toBeGreaterThan(4.5);
});

test('every preset is readable in both schemes', () => {
    for (const preset of ['default', 'yellow', 'dark'] as const) {
        const warn = jest.fn();
        resolveBranding({ ...base, preset }, warn);
        expect(warn).not.toHaveBeenCalled();
    }
});

test('missing font weights use the nearest one given', () => {
    const { faces } = resolveBranding({ ...base, typography: { faces: { '400': 'Inter-Regular', '700': 'Inter-Bold' } } }, jest.fn());
    expect(faces).toEqual({ '400': 'Inter-Regular', '500': 'Inter-Regular', '600': 'Inter-Bold', '700': 'Inter-Bold', '800': 'Inter-Bold' });
});
