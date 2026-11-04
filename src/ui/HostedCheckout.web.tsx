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

    return (
        <iframe
            ref={frame}
            title='Secure checkout'
            src={'uri' in checkout ? checkout.uri : undefined}
            srcDoc={'html' in checkout ? checkout.html : undefined}
            sandbox='allow-scripts allow-forms'
            style={{ width: '100%', height: '100%', border: 0, background: '#fff' }}
        />
    );
}
