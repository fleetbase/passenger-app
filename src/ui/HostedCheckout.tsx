import React from 'react';
import { WebView } from 'react-native-webview';
import type { Checkout, PaymentResult } from '../services/types';

export function HostedCheckout({ checkout, onResult }: { checkout: Checkout; onResult: (result: PaymentResult) => void }) {
    return (
        <WebView
            source={checkout}
            originWhitelist={['*']}
            onMessage={({ nativeEvent }) => {
                if (nativeEvent.data === 'paid' || nativeEvent.data === 'failed') {
                    onResult(nativeEvent.data);
                }
            }}
            // The operator's invoice page comes back with `payment=success` or `payment=cancelled`
            // from the card provider. Either way the server decides whether the trip is paid.
            onNavigationStateChange={({ url }) => {
                const outcome = /[?&]payment=(success|cancelled)/.exec(url)?.[1];
                if (outcome) {
                    onResult(outcome === 'success' ? 'paid' : 'failed');
                }
            }}
        />
    );
}
