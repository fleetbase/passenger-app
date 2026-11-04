import React, { createContext, useContext, useMemo } from 'react';
import type { ScreenRegistry } from './registry';
import type { ScreenErrorReporter } from './types';
import type { ScreenId } from './screen-ids';

export type ScreenRegistryContextValue = {
    registry: ScreenRegistry;
    /** Rendered while a screen module loads. */
    renderLoading: (id: ScreenId) => React.ReactNode;
    onError: ScreenErrorReporter;
};

export const defaultScreenErrorReporter: ScreenErrorReporter = (error, { id, source }) => {
    console.error(`[screen-registry] ${source} screen "${id}" failed; falling back.`, error);
};

const ScreenRegistryContext = createContext<ScreenRegistryContextValue | null>(null);

type ProviderProps = {
    registry: ScreenRegistry;
    renderLoading?: ScreenRegistryContextValue['renderLoading'];
    onError?: ScreenErrorReporter;
    children: React.ReactNode;
};

export const ScreenRegistryProvider = ({ registry, renderLoading, onError, children }: ProviderProps) => {
    const value = useMemo<ScreenRegistryContextValue>(
        () => ({
            registry,
            renderLoading: renderLoading ?? (() => null),
            onError: onError ?? defaultScreenErrorReporter,
        }),
        [registry, renderLoading, onError]
    );
    return <ScreenRegistryContext.Provider value={value}>{children}</ScreenRegistryContext.Provider>;
};

/** The active screen registry. Screens rendered through screenSlot must be inside a ScreenRegistryProvider. */
export const useScreenRegistry = (): ScreenRegistryContextValue => {
    const context = useContext(ScreenRegistryContext);
    if (!context) {
        throw new Error('[screen-registry] screenSlot rendered outside ScreenRegistryProvider.');
    }
    return context;
};
