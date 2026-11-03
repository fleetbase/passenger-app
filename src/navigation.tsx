import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { SignInScreen } from './screens/auth';
import { ChooseScreen, DestinationScreen, HomeScreen } from './screens/booking';
import { PayScreen, RateScreen, RideScreen } from './screens/ride';
import { useApp } from './state/AppContext';

export type RootStack = {
    SignIn: undefined;
    Home: undefined;
    Destination: undefined;
    Choose: undefined;
    Ride: undefined;
    Pay: undefined;
    Rate: undefined;
};

const Stack = createNativeStackNavigator<RootStack>();

export function Navigation() {
    const { firstName } = useApp();
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {firstName ? (
                    <>
                        <Stack.Screen name='Home' component={HomeScreen} />
                        <Stack.Screen name='Destination' component={DestinationScreen} />
                        <Stack.Screen name='Choose' component={ChooseScreen} />
                        <Stack.Screen name='Ride' component={RideScreen} options={{ gestureEnabled: false }} />
                        <Stack.Screen name='Pay' component={PayScreen} options={{ gestureEnabled: false }} />
                        <Stack.Screen name='Rate' component={RateScreen} options={{ gestureEnabled: false }} />
                    </>
                ) : (
                    <Stack.Screen name='SignIn' component={SignInScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
