import { createStubService, sampleMoney } from '../src/services/stub';
import type { Ride } from '../src/services/types';

jest.useFakeTimers();

test('a requested ride moves through every status to completed', async () => {
    const service = createStubService();
    const pickup = await service.currentPickup();
    const [dropoff] = await service.searchPlaces('Central');
    const [quote] = await service.quotes(pickup, dropoff);
    const statuses: Ride['status'][] = [];

    const ride = await service.requestRide({ pickup, dropoff, quote, payment: 'cash' }, (update) => {
        if (statuses[statuses.length - 1] !== update.status) {
            statuses.push(update.status);
        }
    });

    expect(ride.status).toBe('searching');
    await jest.advanceTimersByTimeAsync(120000);
    expect(statuses).toEqual(['driver_en_route', 'arrived', 'in_progress', 'completed']);
});

test('a canceled ride stops updating', async () => {
    const service = createStubService();
    const pickup = await service.currentPickup();
    const [dropoff] = await service.searchPlaces('Central');
    const [quote] = await service.quotes(pickup, dropoff);
    const onUpdate = jest.fn();

    const ride = await service.requestRide({ pickup, dropoff, quote, payment: 'card' }, onUpdate);
    await service.cancelRide(ride.id);
    await jest.advanceTimersByTimeAsync(120000);
    expect(onUpdate).not.toHaveBeenCalled();
});

test('a finished ride appears in trips, and a card ride is unpaid until checkout confirms it', async () => {
    const service = createStubService();
    const pickup = await service.currentPickup();
    const [dropoff] = await service.searchPlaces('Central');
    const [quote] = await service.quotes(pickup, dropoff);

    const ride = await service.requestRide({ pickup, dropoff, quote, payment: 'card' }, () => {});
    await jest.advanceTimersByTimeAsync(120000);
    expect((await service.trip(ride.id))?.paid).toBe(false);

    expect(await service.confirmPayment(ride.id, 'failed')).toBe('failed');
    expect((await service.trip(ride.id))?.paid).toBe(false);

    expect(await service.confirmPayment(ride.id, 'paid')).toBe('paid');
    expect((await service.trips())[0]).toMatchObject({ id: ride.id, status: 'completed', paid: true });
});

test('a canceled ride appears in trips with no fare', async () => {
    const service = createStubService();
    const pickup = await service.currentPickup();
    const [dropoff] = await service.searchPlaces('Central');
    const [quote] = await service.quotes(pickup, dropoff);

    const ride = await service.requestRide({ pickup, dropoff, quote, payment: 'cash' }, () => {});
    await service.cancelRide(ride.id);
    expect(await service.trip(ride.id)).toMatchObject({ status: 'canceled', fare: undefined, paid: false });
});

test('saved places can be added, edited and deleted', async () => {
    const service = createStubService();
    const place = await service.savePlace({ name: 'Gym', address: '7 Mill Lane' });
    expect(await service.searchPlaces('gym')).toEqual([place]);

    await service.savePlace({ id: place.id, name: 'Pool', address: '7 Mill Lane' });
    expect((await service.savedPlaces()).map((item) => item.name)).toContain('Pool');

    await service.deletePlace(place.id);
    expect((await service.savedPlaces()).map((item) => item.id)).not.toContain(place.id);
});

test('watchers see sent messages and the driver reply until they stop watching', async () => {
    const service = createStubService();
    const onChange = jest.fn();
    const stop = service.watchMessages('ride', onChange);
    expect(onChange).toHaveBeenLastCalledWith([]);

    await service.sendMessage('ride', 'On my way');
    expect(onChange.mock.lastCall?.[0].map((message: { from: string }) => message.from)).toEqual(['rider']);

    await jest.advanceTimersByTimeAsync(2000);
    expect(onChange.mock.lastCall?.[0].map((message: { from: string }) => message.from)).toEqual(['rider', 'driver']);

    stop();
    const calls = onChange.mock.calls.length;
    await service.sendMessage('ride', 'Again');
    expect(onChange.mock.calls.length).toBe(calls);
});

test('deleting an account clears saved places and trips', async () => {
    const service = createStubService();
    await service.deleteAccount();
    expect(await service.savedPlaces()).toEqual([]);
    expect(await service.trips()).toEqual([]);
});

test('sample places and fares follow the area a host gives', async () => {
    const london = { latitude: 51.5072, longitude: -0.1276 };
    const service = createStubService({ center: london, currency: 'GBP' });
    const pickup = await service.currentPickup();
    expect(pickup.location).toEqual(london);
    const [station] = await service.searchPlaces('Central');
    expect(Math.abs(station.location.latitude - london.latitude)).toBeLessThan(0.05);
    const [quote] = await service.quotes(pickup, station);
    expect(quote.fare).toBe('£14.20');
});

test('sample fares are rounded the way a currency is written', () => {
    expect(sampleMoney(14.2)).toBe('$14.20');
    expect(sampleMoney(14.2, 'JPY')).toBe('¥2,100');
    expect(sampleMoney(14.2, 'IDR')).toMatch(/^Rp\s213,000$/);
    expect(sampleMoney(14.2, 'EUR')).toBe('€14.20');
});
