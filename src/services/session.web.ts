import type { Profile } from './types';

export type Session = { token: string; profile: Profile };

const KEY = 'passenger.session';

// Browsers have no secure storage. sessionStorage at least ends with the tab, and page scripts
// can still read it, so the web build keeps sign-in shorter than the apps do.
export async function readSession(): Promise<Session | undefined> {
    const saved = window.sessionStorage.getItem(KEY);
    return saved ? (JSON.parse(saved) as Session) : undefined;
}

export async function saveSession(session: Session): Promise<void> {
    window.sessionStorage.setItem(KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
    window.sessionStorage.removeItem(KEY);
}
