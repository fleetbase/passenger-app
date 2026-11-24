import { createHostedPreview, parseOrigins, readHostedPreview } from '../src/preview/host';

test('a build without preview origins is never a hosted preview', () => {
    const preview = createHostedPreview({ origins: [], target: { __PASSENGER_PREVIEW__: { sample: {} } } });
    expect(preview.enabled).toBe(false);
    expect(preview.initial).toBeNull();
});

test('a preview build reads the host page, or runs on defaults without one', () => {
    const origins = parseOrigins(' https://apphelm.fleetbase.io, https://preview.example ');
    expect(origins).toEqual(['https://apphelm.fleetbase.io', 'https://preview.example']);
    expect(createHostedPreview({ origins, target: {} }).initial).toEqual({ sample: {} });
    const preview = createHostedPreview({
        origins,
        target: { __PASSENGER_PREVIEW__: { branding: { name: 'Bayline Taxi' }, logo: '/p/abc/brand/logo', sample: { center: { latitude: 51.5, longitude: -0.12 }, currency: 'GBP' } } },
    });
    expect(preview.enabled).toBe(true);
    expect(preview.initial?.branding?.name).toBe('Bayline Taxi');
    expect(preview.initial?.logo).toBe('/p/abc/brand/logo');
    expect(preview.initial?.sample).toEqual({ center: { latitude: 51.5, longitude: -0.12 }, currency: 'GBP' });
});

test('values the host page gets wrong are dropped', () => {
    expect(readHostedPreview('nope')).toBeNull();
    expect(
        readHostedPreview({ branding: 'x', logo: 'javascript:alert(1)', sample: { center: { latitude: 200, longitude: 0 }, currency: 'pounds' } })
    ).toEqual({ branding: undefined, logo: undefined, logoDark: undefined, sample: { center: undefined, currency: undefined } });
});
