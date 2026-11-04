import type React from 'react';
import type { Driver, Quote, Trip } from '../../services/types';
import type { ScreenPlatform } from '../screens/types';
import type { ComponentId } from './component-ids';

/** Props per component id. An override receives exactly these, plus `Default`. */
export type ComponentPropsMap = {
    'ride.driverCard': { driver: Driver; compact?: boolean };
    'booking.classCard': { quote?: Quote; index: number; selected: boolean; onPress: () => void };
    'trips.row': { trip: Trip; last: boolean; onPress: () => void };
};

export type PassengerComponentProps<Id extends ComponentId> = ComponentPropsMap[Id] & {
    /** The app's own implementation, so an override can wrap or compose it. */
    Default: React.ComponentType<ComponentPropsMap[Id]>;
};

export type ComponentEntry<Id extends ComponentId> = {
    /** Loads the implementation: `() => import('./components/MyDriverCard')`. */
    load: () => Promise<{ default: React.ComponentType<PassengerComponentProps<Id>> | React.ComponentType<any> }>;
    /** Restrict the entry to some platforms; other platforms keep the default. */
    platforms?: ScreenPlatform[];
};

export type ComponentOverrides = Partial<{ [Id in ComponentId]: ComponentEntry<Id> }>;
