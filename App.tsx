import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider } from 'tamagui';
import { Navigation } from './src/navigation';
import { AppProvider } from './src/state/AppContext';
import config from './tamagui.config';

export default function App() {
    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    return (
        <TamaguiProvider config={config} defaultTheme={scheme}>
            <SafeAreaProvider>
                <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
                <AppProvider>
                    <Navigation />
                </AppProvider>
            </SafeAreaProvider>
        </TamaguiProvider>
    );
}
