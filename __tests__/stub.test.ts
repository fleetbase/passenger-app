import { createStubService } from '../src/services/stub';
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
