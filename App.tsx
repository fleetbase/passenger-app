import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider, Theme } from 'tamagui';
import { registerBrandFonts } from './src/branding/fonts';
import { preloadExtensions } from './src/extensions/app-registry';
import { Navigation } from './src/navigation';
import { AppProvider, useApp } from './src/state/AppContext';
import config from './tamagui.config';

registerBrandFonts();
preloadExtensions();

function Themed() {
    const { scheme } = useApp();
    return (
        <TamaguiProvider config={config} defaultTheme={scheme}>
            <Theme name={scheme}>
                <SafeAreaProvider>
                    <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
                    <Navigation />
                </SafeAreaProvider>
            </Theme>
        </TamaguiProvider>
    );
}

export default function App() {
    return (
        <AppProvider>
            <Themed />
        </AppProvider>
    );
}
