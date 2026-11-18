import type { PushDevice } from './types';

export type PushData = { id?: string; type?: string; [key: string]: unknown };

/** The web build gets no pushes; the ride screen keeps itself up to date. */
export function startPush(_handlers: {
    onToken: (device: PushDevice) => void;
    onOpen: (data: PushData) => void;
    onReceive?: (data: PushData) => void;
}): () => void {
    return () => {};
}
