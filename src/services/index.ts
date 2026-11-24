import { env } from '../generated/env';
import { hostedPreview, isHostedPreview } from '../preview/host';
import { createFleetbaseService } from './fleetbase';
import { createStubService } from './stub';
import type { RideService } from './types';

/** On only when a build asks for it, or in a hosted preview. Otherwise the app talks to Fleet-Ops. */
export const sampleMode = env.sampleData || isHostedPreview;

/** A hosted preview is labelled by its host, so the app doesn't add its own sample banner. */
export const showSampleBanner = sampleMode && !isHostedPreview;

export const createService = (): RideService =>
    sampleMode
        ? createStubService(hostedPreview?.sample)
        : createFleetbaseService({ host: env.host, key: env.key, orderConfig: env.orderConfig, pushApp: env.pushApp });
