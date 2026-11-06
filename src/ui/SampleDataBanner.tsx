import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';
import { T } from '.';

/** Always visible in sample mode, so simulated rides are never mistaken for real ones. */
export function SampleDataBanner() {
    const { top } = useSafeAreaInsets();
    return (
        <YStack accessibilityLabel='Sample data, not connected to a server' position='absolute' top={Math.max(top - 8, 0)} alignSelf='center' zIndex={1000} pointerEvents='none' backgroundColor='$warnBg' paddingHorizontal={10} paddingVertical={2} borderRadius={10}>
            <T variant='caption' tone='$warnFg'>Sample data</T>
        </YStack>
    );
}
