import type React from 'react';
import type { ScreenId } from './screen-ids';

export type ScreenPlatform = 'ios' | 'android' | 'web';

export type ScreenParams = {
    'trips.detail': { tripId: string };
    'trips.receipt': { tripId: string };
    'places.edit': { placeId?: string };
};

export type PassengerScreenBaseProps<Id extends ScreenId> = {
    route: { key: string; name: string; params: Id extends keyof ScreenParams ? ScreenParams[Id] : undefined };
    navigation: any;
};

export type PassengerScreenProps<Id extends ScreenId> = PassengerScreenBaseProps<Id> & {
    /** The default implementation of this screen, so an override can wrap or compose it. */
    DefaultScreen: React.ComponentType<PassengerScreenBaseProps<Id>>;
};

export type ScreenEntry<Id extends ScreenId> = {
    /** Loads the implementation. Use `() => import('./MyScreen')`; platform files resolve as usual. */
    load: () => Promise<{ default: React.ComponentType<PassengerScreenProps<Id>> | React.ComponentType<any> }>;
    /** Restrict the entry to some platforms; other platforms keep the default. */
    platforms?: ScreenPlatform[];
};

export type ScreenOverrides = Partial<{ [Id in ScreenId]: ScreenEntry<Id> }>;

export type LoadableComponent = React.ComponentType<any> & { preload: () => Promise<React.ComponentType<any>> };

export type ScreenSource = 'default' | 'override';

export type ResolvedScreen = {
    Component: React.ComponentType<any>;
    Default: React.ComponentType<any>;
    source: ScreenSource;
};

export type ScreenErrorReporter = (error: unknown, context: { id: string; source: ScreenSource }) => void;
