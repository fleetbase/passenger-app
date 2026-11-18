import { env } from '../generated/env';
import { createFleetbaseService } from './fleetbase';
import { createStubService } from './stub';
import type { RideService } from './types';

/** On only when a build asks for it. Otherwise the app talks to Fleet-Ops. */
export const sampleMode = env.sampleData;

export const createService = (): RideService => (sampleMode ? createStubService() : createFleetbaseService({ host: env.host, key: env.key, orderConfig: env.orderConfig, pushApp: env.pushApp }));
