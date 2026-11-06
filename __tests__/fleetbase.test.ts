import { createFleetbaseService } from '../src/services/fleetbase';
import { clearSession, readSession } from '../src/services/session';

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
        const path = url.replace(/^http:\/\/api\.test\/(v1\/)?/, '').split('?')[0];
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

test('quotes use the rate as id, format the smallest unit, and show seats and pickup time when known', async () => {
    const { service, sent } = await signedIn({
        'GET service-quotes': () => [
            200,
            [
                { service_rate: 'service_a', service_name: 'Economy', amount: 2575, currency: 'USD', meta: { seats: null, pickup_eta: null } },
                { service_rate: 'service_b', service_name: 'XL', amount: 3400, currency: 'JPY', meta: { seats: 6, pickup_eta: 200 } },
            ],
        ],
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
    expect(url).toContain('availability=1');
    expect(quotes[0].seats).toBeUndefined();
    expect(quotes[1]).toMatchObject({ seats: 6, pickupMinutes: 3 });
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

test('deleting the account ends the session', async () => {
    const { service, sent } = await signedIn({ 'DELETE customers/me': () => [200, { status: 'deleted' }] });
    await service.deleteAccount();
    expect(sent[sent.length - 1]).toMatchObject({ method: 'DELETE' });
    expect(clearSession).toHaveBeenCalled();
    await expect(service.savedPlaces()).rejects.toThrow('No rider is signed in');
});

test('the operator settings override the brand, and stay unset when missing', async () => {
    const { service, sent } = await signedIn({ 'GET customers/ride-settings': () => [200, { emergency_number: '995', support: { phone: null, email: 'help@cabs.test' } }] });
    await expect(service.rideSettings()).resolves.toEqual({ emergencyNumber: '995', supportPhone: undefined, supportEmail: 'help@cabs.test' });
    expect(sent[sent.length - 1].headers.get('Customer-Token')).toBe('rider-token');
});

test('a rating and a share link go to the ride', async () => {
    const { service, sent } = await signedIn({
        'POST customers/orders/order_ride/rating': () => [200, { status: 'rated' }],
        'POST customers/orders/order_ride/share': () => [200, { url: 'https://console.test/~/track/PAS1?share=1.abc' }],
    });
    await service.rateDriver('order_ride', 4, '  ');
    expect(sent[sent.length - 1].body).toEqual({ stars: 4 });
    await service.rateDriver('order_ride', 5, ' Lovely ');
    expect(sent[sent.length - 1].body).toEqual({ stars: 5, comment: 'Lovely' });
    await expect(service.shareLink('order_ride')).resolves.toBe('https://console.test/~/track/PAS1?share=1.abc');
});

test('paying opens the hosted invoice page, and only the invoice says whether it is paid', async () => {
    let status = 'sent';
    const { service, sent } = await signedIn({
        'GET ledger/v1/customers/orders/order_ride/invoice': () => [200, { invoice: { id: 'invoice_1', status, payment_url: 'https://console.test/~/invoice?id=invoice_1' } }],
        'GET ledger/v1/customers/orders/order_none/invoice': () => [200, { invoice: null }],
    });
    await expect(service.createCheckout('order_ride')).resolves.toEqual({ uri: 'https://console.test/~/invoice?id=invoice_1' });
    expect(sent[sent.length - 1].headers.get('Customer-Token')).toBe('rider-token');
    await expect(service.confirmPayment('order_ride', 'paid')).resolves.toBe('failed');
    status = 'paid';
    await expect(service.confirmPayment('order_ride', 'failed')).resolves.toBe('paid');
    await expect(service.createCheckout('order_none')).rejects.toThrow("isn't ready");
    await expect(service.confirmPayment('order_none', 'paid')).resolves.toBe('failed');
});

test('paying needs a signed-in rider', async () => {
    const service = createFleetbaseService({ host: 'http://api.test', key: 'flb_live_test' });
    await expect(service.createCheckout('order_ride')).rejects.toThrow('No rider is signed in');
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


const pickup = { id: 'current-location', name: '1 Raffles Place', detail: 'Downtown', location: { latitude: 1.2841, longitude: 103.8511 } };
const dropoff = { id: 'place_abc', name: 'Bugis', detail: '', location: { latitude: 1.3005, longitude: 103.8452 } };
const economy = { id: 'service_a', className: 'Economy', fare: '$5.33' };

const order = (status: string, extra: Record<string, unknown> = {}) => [200, { id: 'order_ride', status, created_at: '2026-11-06T01:00:00Z', ...extra }] as [number, unknown];

describe('a ride', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    const tick = async () => {
        await jest.advanceTimersByTimeAsync(3000);
    };

    test('is booked with a fare the order can hold, then followed until the driver drops the rider off', async () => {
        let status = order('dispatched');
        const { service, sent } = await signedIn({
            'GET service-quotes': () => [200, [{ id: 'quote_stored', service_rate: 'service_a', service_name: 'Economy', amount: 533, currency: 'USD' }]],
            'POST customers/orders': () => [200, { id: 'order_ride', status: 'created' }],
            'POST customers/orders/order_ride/dispatch': () => [200, { id: 'order_ride', status: 'dispatched' }],
            'GET customers/orders/order_ride': () => status,
            'GET customers/orders/order_ride/driver': () => [200, { driver: { name: 'Chen Test', rating: 4.86 }, vehicle: { make: 'Honda', model: 'Jazz', color: 'Silver', plate_number: 'KTX 5512' } }],
            'GET customers/orders/order_ride/tracker': () => [200, { driver: { location: { coordinates: [103.8511, 1.287] }, location_age_seconds: 4 }, route: { legs: [{ duration_s: 130 }] }, eta: { completion_seconds: 420 } }],
        });
        const updates: any[] = [];
        const ride = await service.requestRide({ pickup, dropoff, quote: economy, payment: 'cash' }, (next) => updates.push(next));

        expect(ride).toMatchObject({ id: 'order_ride', status: 'searching' });
        const stored = sent.find((request) => request.url.includes('service-quotes'))!;
        expect(decodeURIComponent(stored.url)).toContain('service=service_a');
        expect(stored.url).not.toContain('preview');
        const created = sent.find((request) => request.method === 'POST' && request.url.endsWith('/customers/orders'))!;
        expect(created.body).toEqual({
            type: 'ride',
            service_quote: 'quote_stored',
            pickup: { name: '1 Raffles Place', street1: 'Downtown', latitude: 1.2841, longitude: 103.8511 },
            dropoff: { name: 'Bugis', street1: 'Bugis', latitude: 1.3005, longitude: 103.8452 },
            meta: { payment: 'cash' },
        });

        await tick();
        expect(updates[updates.length - 1].status).toBe('searching');

        status = order('started');
        await tick();
        expect(updates[updates.length - 1]).toMatchObject({
            status: 'driver_en_route',
            driver: { name: 'Chen Test', initials: 'CT', rating: 4.86, vehicle: 'Silver Honda Jazz', plate: 'KTX 5512' },
            carPosition: { latitude: 1.287, longitude: 103.8511 },
            stale: false,
            etaMinutes: 2,
        });

        status = order('in_progress');
        await tick();
        expect(updates[updates.length - 1]).toMatchObject({ status: 'in_progress', etaMinutes: 7 });
        expect(sent.filter((request) => request.url.includes('/driver')).length).toBe(1);

        status = order('completed', { meta: { fare: { total: 612, currency: 'USD', lines: [{ label: 'Base fare', amount: 300 }] } } });
        await tick();
        const done = updates[updates.length - 1];
        expect(done.status).toBe('completed');
        expect(done.fare).toMatchObject({ total: expect.stringContaining('6.12'), estimate: '$5.33', lines: [{ label: 'Base fare', amount: expect.stringContaining('3.00') }] });

        const calls = sent.length;
        await tick();
        expect(sent.length).toBe(calls);
    });

    test('says when no driver was found, and when the car stops reporting', async () => {
        let status = order('started');
        const { service } = await signedIn({
            'GET service-quotes': () => [200, [{ id: 'quote_stored', service_rate: 'service_a', service_name: 'Economy', amount: 533, currency: 'USD' }]],
            'POST customers/orders': () => [200, { id: 'order_ride', status: 'created' }],
            'POST customers/orders/order_ride/dispatch': () => [200, {}],
            'GET customers/orders/order_ride': () => status,
            'GET customers/orders/order_ride/driver': () => [200, { driver: { name: 'Chen' }, vehicle: null }],
            'GET customers/orders/order_ride/tracker': () => [200, { driver: { location: null, location_age_seconds: 300 } }],
        });
        const updates: any[] = [];
        await service.requestRide({ pickup, dropoff, quote: economy, payment: 'card' }, (next) => updates.push(next));
        await tick();
        expect(updates[0]).toMatchObject({ status: 'driver_en_route', stale: true, driver: { name: 'Chen', rating: undefined, plate: '' } });
        expect(updates[0].etaMinutes).toBeUndefined();

        status = order('canceled', { meta: { dispatch_outcome: 'no_driver_found' } });
        await tick();
        expect(updates[updates.length - 1].status).toBe('no_driver');
    });

    test('a ride under way is picked up again after a restart, and finished ones are not', async () => {
        const live = { id: 'order_ride', type: 'ride', dispatched: true, status: 'arrived', created_at: '2026-11-06T01:00:00Z', transaction_amount: 555, currency: 'USD', meta: { service_name: 'Economy', payment: 'card' }, payload: { pickup: place('Raffles', 103.85, 1.28), dropoff: place('Bugis', 103.84, 1.3) } };
        let orders: unknown[] = [{ ...live, id: 'order_old', status: 'completed' }, { ...live, id: 'order_parcel', type: 'transport' }, live];
        const { service, sent } = await signedIn({
            'GET customers/orders': () => [200, orders],
            'GET customers/orders/order_ride': () => order('arrived'),
            'GET customers/orders/order_ride/driver': () => [200, { driver: { name: 'Chen' }, vehicle: null }],
            'GET customers/orders/order_ride/tracker': () => [200, {}],
        });
        const onUpdate = jest.fn();
        const ride = await service.activeRide(onUpdate);
        expect(ride).toMatchObject({ id: 'order_ride', status: 'arrived', payment: 'card', quote: { className: 'Economy', fare: expect.stringContaining('5.55') }, pickup: { name: 'Raffles' } });
        expect(decodeURIComponent(sent[sent.length - 1].url)).toContain('sort=-created_at');
        await tick();
        expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'arrived', driver: expect.objectContaining({ name: 'Chen' }) }));

        orders = [{ ...live, status: 'canceled' }, { ...live, payload: { pickup: null, dropoff: null } }];
        await expect(service.activeRide(onUpdate)).resolves.toBeUndefined();
    });

    test('a class that can no longer be priced is not booked', async () => {
        const { service, sent } = await signedIn({ 'GET service-quotes': () => [200, []] });
        await expect(service.requestRide({ pickup, dropoff, quote: economy, payment: 'cash' }, () => {})).rejects.toThrow('no longer available');
        expect(sent.some((request) => request.url.endsWith('/customers/orders'))).toBe(false);
    });

    test('canceling stops following the ride and tells the server', async () => {
        const { service, sent } = await signedIn({
            'GET service-quotes': () => [200, [{ id: 'quote_stored', service_rate: 'service_a', service_name: 'Economy', amount: 533, currency: 'USD' }]],
            'POST customers/orders': () => [200, { id: 'order_ride', status: 'created' }],
            'POST customers/orders/order_ride/dispatch': () => [200, {}],
            'POST customers/orders/order_ride/cancel': () => [200, { status: 'canceled' }],
            'GET customers/orders/order_ride': () => order('dispatched'),
        });
        const onUpdate = jest.fn();
        await service.requestRide({ pickup, dropoff, quote: economy, payment: 'cash' }, onUpdate);
        await service.cancelRide('order_ride');
        await tick();
        expect(onUpdate).not.toHaveBeenCalled();
        expect(sent[sent.length - 1].url).toContain('customers/orders/order_ride/cancel');
    });

    test('a failed refresh is tried again', async () => {
        let fail = true;
        const { service } = await signedIn({
            'GET service-quotes': () => [200, [{ id: 'quote_stored', service_rate: 'service_a', service_name: 'Economy', amount: 533, currency: 'USD' }]],
            'POST customers/orders': () => [200, { id: 'order_ride', status: 'created' }],
            'POST customers/orders/order_ride/dispatch': () => [200, {}],
            'GET customers/orders/order_ride': () => (fail ? [500, { error: 'Down' }] : order('dispatched')),
        });
        const onUpdate = jest.fn();
        await service.requestRide({ pickup, dropoff, quote: economy, payment: 'cash' }, onUpdate);
        await tick();
        expect(onUpdate).not.toHaveBeenCalled();
        fail = false;
        await tick();
        expect(onUpdate).toHaveBeenCalledTimes(1);
    });
});

describe('the chat with the driver', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    test('refreshes, shows a sent message straight away, and stops when closed', async () => {
        let messages: unknown[] = [];
        let fail = false;
        const { service, sent } = await signedIn({
            'GET customers/orders/order_ride/messages': () => (fail ? [500, {}] : [200, messages]),
            'POST customers/orders/order_ride/messages': () => {
                messages = [...messages, { id: 'm1', from: 'rider', text: 'Hi', sent_at: '2026-11-06T01:00:00Z' }];
                return [201, messages[0]];
            },
        });
        const seen: any[] = [];
        const stop = service.watchMessages('order_ride', (list) => seen.push(list));
        await jest.advanceTimersByTimeAsync(0);
        expect(seen).toEqual([[], []]);

        await service.sendMessage('order_ride', 'Hi');
        await jest.advanceTimersByTimeAsync(0);
        expect(seen[seen.length - 1]).toEqual([{ id: 'm1', from: 'rider', text: 'Hi', sentAt: '2026-11-06T01:00:00Z' }]);
        expect(sent.find((request) => request.method === 'POST' && request.url.endsWith('/messages'))!.body).toEqual({ text: 'Hi' });

        fail = true;
        const before = seen.length;
        await jest.advanceTimersByTimeAsync(3000);
        expect(seen.length).toBe(before);

        stop();
        fail = false;
        const calls = sent.length;
        await jest.advanceTimersByTimeAsync(9000);
        expect(sent.length).toBe(calls);
    });
});
