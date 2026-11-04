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
        />
    );
}
