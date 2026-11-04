/// <reference lib="dom" />
import type { ShareOutcome } from './share';

const copyWithSelection = (text: string) => {
    const field = document.createElement('textarea');
    field.value = text;
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    if (!copied) {
        throw new Error('Copy failed');
    }
};

/** Browsers without a share sheet get the text on the clipboard instead. */
export async function share(message: string): Promise<ShareOutcome> {
    if (navigator.share) {
        try {
            await navigator.share({ text: message });
            return 'shared';
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                return 'dismissed';
            }
        }
    }
    try {
        await navigator.clipboard.writeText(message);
    } catch {
        // The clipboard API needs HTTPS and permission, so fall back to the older way.
        copyWithSelection(message);
    }
    return 'copied';
}
