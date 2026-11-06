import React, { Suspense } from 'react';
import { Platform } from 'react-native';
import { getBuildExtensions } from '../build-extensions';
import { createLoadable } from '../screens/loadable';
import ScreenErrorBoundary from '../screens/ScreenErrorBoundary';
import type { LoadableComponent } from '../screens/types';
import { COMPONENT_IDS, isComponentId, type ComponentId } from './component-ids';
import type { ComponentEntry, ComponentOverrides, ComponentPropsMap } from './types';

type Options = {
    overrides?: ComponentOverrides;
    platform?: string;
    strict?: boolean;
    warn?: (message: string) => void;
};

function isValidEntry(entry: unknown): entry is ComponentEntry<any> {
    if (!entry || typeof entry !== 'object') {
        return false;
    }
    const candidate = entry as ComponentEntry<any>;
    return typeof candidate.load === 'function' && (candidate.platforms === undefined || Array.isArray(candidate.platforms));
}

/**
 * Checks a build's component overrides: an unknown id or a malformed entry throws in
 * strict mode (development) and is dropped with a warning otherwise.
 */
export function validateComponentOverrides(overrides: unknown, { platform = Platform.OS, strict = typeof __DEV__ !== 'undefined' ? __DEV__ : false, warn = console.warn }: Omit<Options, 'overrides'> = {}): ComponentOverrides {
    const reject = (message: string) => {
        if (strict) {
            throw new Error(message);
        }
        warn(message);
    };
    const accepted: ComponentOverrides = {};
    if (!overrides || typeof overrides !== 'object') {
        return accepted;
    }
    for (const [id, entry] of Object.entries(overrides)) {
        if (!isComponentId(id)) {
            reject(`[component-registry] Unknown component id "${id}". Known ids: ${COMPONENT_IDS.join(', ')}`);
        } else if (!isValidEntry(entry)) {
            reject(`[component-registry] Invalid override for "${id}": expected { load: () => import(...) }.`);
        } else if (!entry.platforms || entry.platforms.includes(platform as never)) {
            (accepted as any)[id] = entry;
        }
    }
    return accepted;
}

let buildOverrides: ComponentOverrides | null = null;
const getBuildOverrides = () => (buildOverrides = buildOverrides ?? validateComponentOverrides(getBuildExtensions().components));

const overridden = new Map<ComponentId, LoadableComponent>();

/**
 * The component the app renders for a component id, resolved once when the defining module
 * loads. With no override the default is returned as is, with no wrapper. With one, the
 * override loads lazily and receives the default's props plus `Default`; while it loads,
 * and if it fails to load or throws, the default renders with the same props.
 */
export function componentSlot<Id extends ComponentId, C extends React.ComponentType<ComponentPropsMap[Id]>>(id: Id, Default: C, options: Options = {}): C {
    const overrides = options.overrides ? validateComponentOverrides(options.overrides, options) : getBuildOverrides();
    const entry = overrides[id] as ComponentEntry<Id> | undefined;
    if (!entry) {
        return Default;
    }

    const Override = createLoadable(entry.load as any, `component:${id}`);
    overridden.set(id, Override);
    const DefaultComponent = Default as React.ComponentType<any>;

    const Slot = (props: any) => {
        const report = (error: unknown) => {
            const onError = getBuildExtensions().onError;
            if (onError) {
                onError(error, { id, source: 'override' });
            } else {
                console.error(`[component-registry] override "${id}" failed; falling back to the default.`, error);
            }
        };
        return (
            <ScreenErrorBoundary onError={report} fallback={() => <DefaultComponent {...props} />}>
                <Suspense fallback={<DefaultComponent {...props} />}>
                    <Override {...props} Default={DefaultComponent} />
                </Suspense>
            </ScreenErrorBoundary>
        );
    };
    Slot.displayName = `ComponentSlot(${id})`;
    return Slot as unknown as C;
}

/** Loads every component override in the build, so none renders its default first. */
export function preloadComponentOverrides(): Promise<void> {
    return Promise.all([...overridden.values()].map((component) => component.preload().catch(() => undefined))).then(() => undefined);
}
