import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { branding } from './branding';
import { AppRegistryProvider, customRoutes } from './extensions/app-registry';
import { screenSlot } from './extensions/screens/screen-slot';
import { sampleMode } from './services';
import { SampleDataBanner } from './ui/SampleDataBanner';
import { useApp } from './state/AppContext';

export type RootStack = {
    SignIn: undefined;
    Home: undefined;
    Destination: undefined;
    Choose: undefined;
    Ride: undefined;
    Chat: undefined;
    Pay: undefined;
    Rate: undefined;
    Account: undefined;
    EditProfile: undefined;
    DeleteAccount: undefined;
    Help: undefined;
    Trips: undefined;
    Trip: { tripId: string };
    Receipt: { tripId: string };
    Places: undefined;
    EditPlace: { placeId?: string };
};

const Stack = createNativeStackNavigator<RootStack>();

export function Navigation() {
    const { ready, profile, scheme } = useApp();
    if (!ready) {
        return null;
    }
    return (
        <AppRegistryProvider>
        <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme} documentTitle={{ formatter: () => branding.name }}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {profile ? (
                    <>
                        <Stack.Screen name='Home' component={screenSlot('booking.home')} />
                        <Stack.Screen name='Destination' component={screenSlot('booking.destination')} />
                        <Stack.Screen name='Choose' component={screenSlot('booking.choose')} />
                        <Stack.Screen name='Ride' component={screenSlot('ride.active')} options={{ gestureEnabled: false }} />
                        <Stack.Screen name='Chat' component={screenSlot('ride.chat')} />
                        <Stack.Screen name='Pay' component={screenSlot('ride.pay')} options={{ gestureEnabled: false }} />
                        <Stack.Screen name='Rate' component={screenSlot('ride.rate')} options={{ gestureEnabled: false }} />
                        <Stack.Screen name='Account' component={screenSlot('account.home')} />
                        <Stack.Screen name='EditProfile' component={screenSlot('account.editProfile')} />
                        <Stack.Screen name='DeleteAccount' component={screenSlot('account.delete')} />
                        <Stack.Screen name='Help' component={screenSlot('account.help')} />
                        <Stack.Screen name='Trips' component={screenSlot('trips.list')} />
                        <Stack.Screen name='Trip' component={screenSlot('trips.detail')} />
                        <Stack.Screen name='Receipt' component={screenSlot('trips.receipt')} />
                        <Stack.Screen name='Places' component={screenSlot('places.list')} />
                        <Stack.Screen name='EditPlace' component={screenSlot('places.edit')} />
                        {customRoutes.map((route) => (
                            <Stack.Screen key={route.name} name={route.name as keyof RootStack} component={route.component} />
                        ))}
                    </>
                ) : (
                    <Stack.Screen name='SignIn' component={screenSlot('auth.signIn')} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
        {sampleMode ? <SampleDataBanner /> : null}
        </AppRegistryProvider>
    );
}
