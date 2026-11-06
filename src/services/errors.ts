export class NotConfiguredError extends Error {
    constructor() {
        super('This app has no Fleetbase server set. Set PASSENGER_HOST and PASSENGER_KEY in .env.');
    }
}

/** Thrown by the parts of the service that haven't been connected yet, so they fail visibly. */
export class NotConnectedError extends Error {
    constructor(method: string) {
        super(`${method} isn't connected to Fleet-Ops yet.`);
    }
}

export class LocationUnavailableError extends Error {
    constructor() {
        super('Turn on location for this app to set your pickup.');
    }
}

/** What a screen tells the rider. Only network and server failures use the screen's own wording. */
export const failureText = (cause: unknown, fallback: string) => {
    if (cause instanceof NotConnectedError) {
        return "This isn't available yet.";
    }
    return cause instanceof LocationUnavailableError || cause instanceof NotConfiguredError ? cause.message : fallback;
};
