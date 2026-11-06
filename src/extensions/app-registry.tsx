import React from 'react';
import { Platform } from 'react-native';
import { getBuildExtensions } from './build-extensions';
import { preloadComponentOverrides } from './components/component-slot';
import { defaultScreens } from './default-screens';
import type { CustomRoute } from './define';
import { createLoadable } from './screens/loadable';
import { createScreenRegistry } from './screens/registry';
import { ScreenRegistryProvider } from './screens/ScreenRegistryContext';
import type { LoadableComponent, ScreenPlatform } from './screens/types';

const extensions = getBuildExtensions();

const appRegistry = createScreenRegistry(extensions.screens ?? {}, { defaults: defaultScreens, platform: Platform.OS });

/** Custom routes, loaded lazily. Names can't replace a core route. */
export const customRoutes: { name: string; component: LoadableComponent }[] = Object.entries(extensions.routes ?? {})
    .filter(([, route]: [string, CustomRoute]) => !route.platforms || route.platforms.includes(Platform.OS as ScreenPlatform))
    .map(([name, route]) => ({ name, component: createLoadable(route.load, `route:${name}`) }));

/** Loads overrides before the first screen, so none flashes its default. Never rejects. */
export const preloadExtensions = () =>
    Promise.all([appRegistry.preload(), preloadComponentOverrides(), ...customRoutes.map((route) => route.component.preload().catch(() => undefined))]).then(
        () => undefined,
        () => undefined
    );

export const AppRegistryProvider = ({ children }: { children: React.ReactNode }) => (
    <ScreenRegistryProvider registry={appRegistry} onError={extensions.onError}>
        {children}
    </ScreenRegistryProvider>
);
