import * as Keychain from 'react-native-keychain';
import type { Profile } from './types';

export type Session = { token: string; profile: Profile };

const SERVICE = 'passenger.session';

export async function readSession(): Promise<Session | undefined> {
    const saved = await Keychain.getGenericPassword({ service: SERVICE });
    return saved ? (JSON.parse(saved.password) as Session) : undefined;
}

export async function saveSession(session: Session): Promise<void> {
    await Keychain.setGenericPassword('session', JSON.stringify(session), { service: SERVICE, accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
}

export async function clearSession(): Promise<void> {
    await Keychain.resetGenericPassword({ service: SERVICE });
}
