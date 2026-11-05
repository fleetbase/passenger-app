import { NotConnectedError } from '../src/services/errors';
import { createFleetbaseService } from '../src/services/fleetbase';
import { clearSession, readSession, saveSession } from '../src/services/session';

jest.mock('../src/services/location', () => ({ currentPosition: jest.fn(async () => ({ latitude: 1.28, longitude: 103.85 })) }));
jest.mock('../src/services/session', () => ({
    readSession: jest.fn(async () => undefined),
    saveSession: jest.fn(async () => {}),
    clearSession: jest.fn(async () => {}),
}));

type Sent = { url: string; method: string; headers: Headers; body?: any };

const respondWith = (routes: Record<string, () => [number, unknown]>) => {
    const sent: Sent[] = [];
    (globalThis as any).fetch = jest.fn(async (url: string, init: RequestInit) => {
        sent.push({ url, method: init.method!, headers: new Headers(init.headers), body: init.body ? JSON.parse(init.body as string) : undefined });
        const path = url.replace('http://api.test/v1/', '').split('?')[0];
        const [status, payload] = routes[`${init.method} ${path}`]?.() ?? [404, { error: `No route for ${path}` }];
        return new Response(JSON.stringify(payload), { status });
    });
    return sent;
};

const signedIn = async (routes: Record<string, () => [number, unknown]>) => {
    const sent = respondWith({ 'POST customers/verify-code': () => [200, { name: 'Sam Rider', phone: '+15550190301', token: 'rider-token' }], ...routes });
    const service = createFleetbaseService({ host: 'http://api.test', key: 'flb_live_test' });
    await service.verifyCode('+15550190301', '123456');
    return { service, sent };
};

const place = (name: string, longitude: number, latitude: number, id = 'place_abc') => ({ id, name, street1: `${name} Street`, city: 'Singapore', location: { type: 'Point', coordinates: [longitude, latitude] } });

beforeEach(() => jest.clearAllMocks());

test('asking for a code looks the same for any number', async () => {
    const sent = respondWith({ 'POST customers/request-code': () => [200, { status: 'ok' }] });
    const service = createFleetbaseService({ host: 'http://api.test', key: 'flb_live_test' });
    await expect(service.requestCode('+15550190301')).resolves.toBeUndefined();
    expect(sent).toHaveLength(1);
});

test('a new rider is asked for a name after the code, and signup sends no password', async () => {
    const sent = respondWith({
        'POST customers/verify-code': () => [200, { status: 'new_customer' }],
        'POST customers': () => [201, { name: 'New Rider', phone: '+15550190303', token: 'new-token' }],
    });
    const service = createFleetbaseService({ host: 'http://api.test', key: 'flb_live_test' });
    await expect(service.verifyCode('+15550190303', '123456')).resolves.toBe('needs-name');
    await expect(service.verifyCode('+15550190303', '123456', 'New Rider')).resolves.toMatchObject({ firstName: 'New' });
    const signup = sent.find((request) => request.url.endsWith('/customers'))!;
    expect(signup.body).toEqual({ identity: '+15550190303', code: '123456', name: 'New Rider' });
});

test('other send failures are not treated as a new rider', async () => {
    const sent = respondWith({ 'POST customers/request-code': () => [422, { error: 'This number can not receive messages.' }] });
    const service = createFleetbaseService({ host: 'http://api.test', key: 'flb_live_test' });
    await expect(service.requestCode('+15550190301')).rejects.toThrow('can not receive');
    expect(sent).toHaveLength(1);
});

test('rider calls send the token, and saved places map to coordinates', async () => {
    const { service, sent } = await signedIn({ 'GET customers/places': () => [200, [place('Home', 103.84, 1.27), place('Gym', 103.8, 1.3), { id: 'place_x', name: 'No location', location: null }]] });
    const places = await service.savedPlaces();
    expect(sent[sent.length - 1].headers.get('Customer-Token')).toBe('rider-token');
    expect(places.map((item) => item.saved)).toEqual(['home', 'custom']);
    expect(places[0]).toMatchObject({ name: 'Home', detail: 'Home Street, Singapore', location: { latitude: 1.27, longitude: 103.84 } });
});

test('a rejected token ends the session and tells the app', async () => {
    const { service } = await signedIn({ 'GET customers/orders': () => [401, { error: 'Customer token is missing or invalid.' }] });
    const expired = jest.fn();
    service.onSessionExpired(expired);
    await expect(service.trips()).rejects.toBeDefined();
    expect(expired).toHaveBeenCalledTimes(1);
    expect(clearSession).toHaveBeenCalled();
    await expect(service.savedPlaces()).rejects.toThrow('No rider is signed in');
});

test('other failures keep the rider signed in', async () => {
    const { service } = await signedIn({ 'GET customers/orders': () => [500, { error: 'Boom' }] });
    const expired = jest.fn();
    service.onSessionExpired(expired);
    await expect(service.trips()).rejects.toBeDefined();
    expect(expired).not.toHaveBeenCalled();
    expect(clearSession).not.toHaveBeenCalled();
});

test('a saved sign-in returns straight away and refreshes from the server', async () => {
    (readSession as jest.Mock).mockResolvedValueOnce({ token: 'saved-token', profile: { firstName: 'Old', lastName: 'Name', phone: '+15550190301' } });
    respondWith({ 'GET customers/me': () => [200, { name: 'New Name', phone: '+15550190301' }] });
    const service = createFleetbaseService({ host: 'http://api.test', key: 'flb_live_test' });
    const refreshed = new Promise((resolve) => {
        service.restoreSession(resolve).then((profile) => expect(profile?.firstName).toBe('Old'));
    });
    await expect(refreshed).resolves.toMatchObject({ firstName: 'New' });
});

test('signing out clears the session even if the server call fails', async () => {
    const { service } = await signedIn({ 'POST customers/logout': () => [500, {}] });
    await service.signOut();
    expect(clearSession).toHaveBeenCalled();
    await expect(service.savedPlaces()).rejects.toThrow('No rider is signed in');
});

test('quotes use the rate as id, format the smallest unit and leave seats and ETA empty', async () => {
    const { service, sent } = await signedIn({
        'GET service-quotes': () => [200, [{ service_rate: 'service_a', service_name: 'Economy', amount: 2575, currency: 'USD' }, { service_rate: 'service_b', service_name: 'XL', amount: 3400, currency: 'JPY' }]],
    });
    const from = { id: 'current-location', name: 'Current location', detail: '', location: { latitude: 1.2, longitude: 103.8 } };
    const to = { id: 'place_abc', name: 'Airport', detail: '', location: { latitude: 1.3, longitude: 103.9 } };
    const quotes = await service.quotes(from, to);
    const url = decodeURIComponent(sent[sent.length - 1].url);
    expect(url).toContain('pickup[latitude]=1.2');
    expect(url).toContain('dropoff=place_abc');
    expect(url).toContain('preview=1');
    expect(quotes[0]).toEqual({ id: 'service_a', className: 'Economy', fare: expect.stringContaining('25.75') });
    expect(quotes[1].fare).toContain('3,400');
    expect(quotes[0].seats).toBeUndefined();
});

test('history shows finished trips only, newest first, without claiming how they were paid', async () => {
    const order = (id: string, status: string, created_at: string, extra = {}) => ({ id, status, created_at, payload: { pickup: place('Home', 103.84, 1.27), dropoff: place('Airport', 103.99, 1.36) }, ...extra });
    const { service } = await signedIn({
        'GET customers/orders': () => [200, [
            order('order_old', 'completed', '2026-11-01T00:00:00Z', { transaction_amount: 2340, currency: 'USD', distance: 21000, time: 1500 }),
            order('order_active', 'created', '2026-11-04T00:00:00Z'),
            order('order_new', 'canceled', '2026-11-03T00:00:00Z'),
        ]],
    });
    const trips = await service.trips();
    expect(trips.map((trip) => trip.id)).toEqual(['order_new', 'order_old']);
    expect(trips[1]).toMatchObject({ summary: '21.0 km · 25 min', className: '' });
    expect(trips[1].fare?.total).toContain('23.40');
    expect(trips[1].payment).toBeUndefined();
    expect(trips[1].paid).toBeUndefined();
    expect(trips[0].fare).toBeUndefined();
});

test('a search puts real matches ahead of nearby addresses', async () => {
    const { service } = await signedIn({ 'GET customers/places/search': () => [200, [place('1 Raffles Place', 103.85, 1.28, 'place_a'), place('Changi Airport', 103.99, 1.36, 'place_b')]] });
    expect((await service.searchPlaces('airport')).map((item) => item.name)).toEqual(['Changi Airport', '1 Raffles Place']);
});

test('an empty search shows saved places without querying the company', async () => {
    const { service, sent } = await signedIn({ 'GET customers/places': () => [200, [place('Home', 103.84, 1.27)]] });
    await service.searchPlaces('  ');
    expect(sent.some((request) => request.url.includes('places/search'))).toBe(false);
});

test('a place found by the geocoder gets a stable id and quotes by location', async () => {
    const { service, sent } = await signedIn({
        'GET customers/places/search': () => [200, [{ id: null, name: null, street1: '35 Robinson Road', city: 'Singapore', location: { coordinates: [103.84, 1.27] } }]],
        'GET service-quotes': () => [200, []],
    });
    const [found] = await service.searchPlaces('robinson');
    expect(found).toMatchObject({ id: 'geo:1.27,103.84', name: '35 Robinson Road', detail: 'Singapore' });
    await service.quotes(found, found);
    expect(decodeURIComponent(sent[sent.length - 1].url)).toContain('dropoff[latitude]=1.27');
});

test('parts not built yet fail as not connected', async () => {
    const { service } = await signedIn({});
    await expect(service.deleteAccount()).rejects.toBeInstanceOf(NotConnectedError);
});

test('saving a place finds the address, then stores it for this rider', async () => {
    const { service, sent } = await signedIn({
        'GET customers/geocode': () => [200, [place('1 Raffles Place', 103.85, 1.28, '')]],
        'POST customers/places': () => [201, place('Gym', 103.85, 1.28, 'place_gym')],
        'PUT customers/places/place_gym': () => [200, place('Work', 103.85, 1.28, 'place_gym')],
    });
    await expect(service.savePlace({ name: 'Gym', address: '1 Raffles Place' })).resolves.toMatchObject({ id: 'place_gym', saved: 'custom' });
    expect(sent[sent.length - 1].body).toEqual({ name: 'Gym', street1: '1 Raffles Place', latitude: 1.28, longitude: 103.85 });
    await expect(service.savePlace({ id: 'place_gym', name: 'Work', address: '1 Raffles Place' })).resolves.toMatchObject({ saved: 'work' });
});

test('an address that cannot be found is not saved', async () => {
    const { service, sent } = await signedIn({ 'GET customers/geocode': () => [200, []] });
    await expect(service.savePlace({ name: 'Gym', address: 'nowhere' })).rejects.toThrow("couldn't find that address");
    expect(sent.some((request) => request.method === 'POST' && request.url.endsWith('customers/places'))).toBe(false);
});

test('deleting a place sends the rider token', async () => {
    const { service, sent } = await signedIn({ 'DELETE customers/places/place_abc': () => [200, { status: 'ok' }] });
    await service.deletePlace('place_abc');
    expect(sent[sent.length - 1].headers.get('Customer-Token')).toBe('rider-token');
});

test('pickup uses the street name, and still works when the lookup fails', async () => {
    const found = await signedIn({ 'GET customers/geocode': () => [200, [place('1 Raffles Place', 103.85, 1.28, '')]] });
    await expect(found.service.currentPickup()).resolves.toMatchObject({ name: '1 Raffles Place', location: { latitude: 1.28 } });
    const failed = await signedIn({ 'GET customers/geocode': () => [503, { error: 'down' }] });
    await expect(failed.service.currentPickup()).resolves.toMatchObject({ name: 'Current location' });
});

test('places stored in capitals read normally, and mixed case is left alone', async () => {
    const { service } = await signedIn({
        'GET customers/places': () => [200, [{ id: 'place_a', name: 'HOME', street1: '1 RAFFLES PLACE', city: 'SINGAPORE', location: { coordinates: [103.85, 1.28] } }, { id: 'place_b', name: 'McDonald House', location: { coordinates: [103.85, 1.28] } }]],
    });
    const [home, other] = await service.savedPlaces();
    expect(home).toMatchObject({ name: 'Home', detail: '1 Raffles Place, Singapore', saved: 'home' });
    expect(other.name).toBe('McDonald House');
});

