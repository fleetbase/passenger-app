import React, { Suspense } from 'react';
import ScreenErrorBoundary from './ScreenErrorBoundary';
import { useScreenRegistry } from './ScreenRegistryContext';
import type { ScreenId } from './screen-ids';

const slots = new Map<ScreenId, React.ComponentType<any>>();

/**
 * Returns the component a navigator registers for a screen id.
 *
 * The component is stable per id, so it's safe to pass to `component=`. At render time it
 * resolves the default screen or a compiled-in override from the registry in context. If
 * an override fails to load or render, the default screen renders with the same props.
 * New route params clear a caught failure.
 */
export function screenSlot(id: ScreenId): React.ComponentType<any> {
    const existing = slots.get(id);
    if (existing) {
        return existing;
    }

    const ScreenSlot = (props: any) => {
        const { registry, renderLoading, onError } = useScreenRegistry();
        const { Component, Default, source } = registry.resolve(id);
        if (source === 'default') {
            return <Default {...props} />;
        }
        return (
            <Suspense fallback={renderLoading(id)}>
                <ScreenErrorBoundary resetKey={props.route?.params} onError={(error) => onError(error, { id, source })} fallback={() => <Default {...props} />}>
                    <Component {...props} DefaultScreen={Default} />
                </ScreenErrorBoundary>
            </Suspense>
        );
    };

    ScreenSlot.displayName = `ScreenSlot(${id})`;
    slots.set(id, ScreenSlot);
    return ScreenSlot;
}
