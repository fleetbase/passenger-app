import React, { act } from 'react';
import renderer from 'react-test-renderer';
import { componentSlot } from '../src/extensions/components/component-slot';
import { createScreenRegistry } from '../src/extensions/screens/registry';
import { ScreenRegistryProvider } from '../src/extensions/screens/ScreenRegistryContext';
import { SCREEN_IDS, type ScreenId } from '../src/extensions/screens/screen-ids';
import { screenSlot } from '../src/extensions/screens/screen-slot';

const Text = 'Text' as unknown as React.ComponentType<{ children: React.ReactNode }>;
const Default = () => <Text>default</Text>;
const defaults = Object.fromEntries(SCREEN_IDS.map((id) => [id, Default])) as unknown as Record<ScreenId, React.ComponentType<any>>;

const render = async (element: React.ReactElement) => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
        tree = renderer.create(element);
    });
    return tree;
};

const renderSlot = (id: ScreenId, overrides: object, onError = jest.fn()) => {
    const registry = createScreenRegistry(overrides, { defaults, strict: false, warn: jest.fn() });
    const Slot = screenSlot(id);
    return render(
        <ScreenRegistryProvider registry={registry} onError={onError}>
            <Slot route={{ params: {} }} />
        </ScreenRegistryProvider>
    );
};

test('a screen with no override renders its default', async () => {
    expect((await renderSlot('booking.home', {})).toJSON()).toMatchObject({ children: ['default'] });
});

test('an override renders and can wrap the default', async () => {
    const Override = ({ DefaultScreen }: { DefaultScreen: React.ComponentType }) => (
        <Text>
            <DefaultScreen />
        </Text>
    );
    const tree = await renderSlot('ride.active', { 'ride.active': { load: async () => ({ default: Override }) } });
    expect(JSON.stringify(tree.toJSON())).toContain('default');
});

test('an override that fails to load falls back to the default and reports it', async () => {
    const onError = jest.fn();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const tree = await renderSlot('ride.pay', { 'ride.pay': { load: async () => { throw new Error('broken'); } } }, onError);
    expect(tree.toJSON()).toMatchObject({ children: ['default'] });
    expect(onError).toHaveBeenCalledWith(expect.any(Error), { id: 'ride.pay', source: 'override' });
    spy.mockRestore();
});

test('an override that throws while rendering falls back to the default', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const Broken = () => {
        throw new Error('broken');
    };
    const tree = await renderSlot('trips.list', { 'trips.list': { load: async () => ({ default: Broken }) } });
    expect(tree.toJSON()).toMatchObject({ children: ['default'] });
    spy.mockRestore();
});

test('an unknown screen id is rejected in strict mode and ignored otherwise', () => {
    const overrides = { 'nope.screen': { load: async () => ({ default: Default }) } } as never;
    expect(() => createScreenRegistry(overrides, { defaults, strict: true })).toThrow('Unknown screen id');
    const warn = jest.fn();
    const registry = createScreenRegistry(overrides, { defaults, strict: false, warn });
    expect(warn).toHaveBeenCalled();
    expect(registry.resolve('booking.home').source).toBe('default');
});

test('an override limited to another platform keeps the default', () => {
    const registry = createScreenRegistry({ 'booking.home': { load: async () => ({ default: Default }), platforms: ['android'] } }, { defaults, platform: 'ios' });
    expect(registry.hasOverride('booking.home')).toBe(false);
});

test('with no override, a component slot returns the default itself', () => {
    const Card = () => null;
    expect(componentSlot('ride.driverCard', Card, { overrides: {} })).toBe(Card);
});

test('a component override that fails falls back to the default', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const Card = () => <Text>default card</Text>;
    const Slot = componentSlot('ride.driverCard', Card as never, { overrides: { 'ride.driverCard': { load: async () => { throw new Error('broken'); } } }, strict: false }) as React.ComponentType<any>;
    expect((await render(<Slot driver={{}} />)).toJSON()).toMatchObject({ children: ['default card'] });
    spy.mockRestore();
});
