/// <reference lib="dom" />
import React, { useEffect, useRef } from 'react';
import type { Checkout, PaymentResult } from '../services/types';

export function HostedCheckout({ checkout, onResult }: { checkout: Checkout; onResult: (result: PaymentResult) => void }) {
    const frame = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const listener = (event: MessageEvent) => {
            // Only the checkout frame may report a result, not any other window.
            if (event.source === frame.current?.contentWindow && (event.data === 'paid' || event.data === 'failed')) {
                onResult(event.data);
            }
        };
        window.addEventListener('message', listener);
        return () => window.removeEventListener('message', listener);
    }, [onResult]);

    // Card providers refuse to load inside a frame, so a hosted page opens in its own tab, and
    // the rider comes back to confirm. The server then says whether the trip is paid.
    if ('uri' in checkout) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '100%', padding: 24, textAlign: 'center', fontFamily: 'inherit' }}>
                <p style={{ margin: 0 }}>Checkout opens in a new tab. Come back here when you've paid.</p>
                <button type='button' onClick={() => window.open(checkout.uri, '_blank', 'noopener')} style={{ padding: '12px 20px', borderRadius: 999, border: 0, fontSize: 16, cursor: 'pointer' }}>
                    Open secure checkout
                </button>
            </div>
        );
    }

    return (
        <iframe
            ref={frame}
            title='Secure checkout'
            srcDoc={checkout.html}
            sandbox='allow-scripts allow-forms'
            style={{ width: '100%', height: '100%', border: 0, background: '#fff' }}
        />
    );
}
