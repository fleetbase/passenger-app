import { Share } from 'react-native';

export type ShareOutcome = 'shared' | 'copied' | 'dismissed';

export async function share(message: string): Promise<ShareOutcome> {
    const { action } = await Share.share({ message });
    return action === Share.dismissedAction ? 'dismissed' : 'shared';
}
