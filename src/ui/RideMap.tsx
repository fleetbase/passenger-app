import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useTheme, YStack } from 'tamagui';
import type { Coordinate } from '../services/types';
import { useApp } from '../state/AppContext';
import { Icon } from '.';

export type RideMapProps = {
    center: Coordinate;
    pickup?: Coordinate;
    dropoff?: Coordinate;
    route?: Coordinate[];
    car?: Coordinate;
    showRider?: boolean;
    /** Space to keep clear of floating cards, so the route stays visible. */
    insets?: { top: number; bottom: number };
};

export function RideMap({ center, pickup, dropoff, route, car, showRider, insets = { top: 120, bottom: 320 } }: RideMapProps) {
    const theme = useTheme();
    const { scheme } = useApp();
    const map = useRef<MapView>(null);
    const routeKey = route?.map((point) => `${point.latitude},${point.longitude}`).join('|');

    const fitRoute = () => {
        if (route?.length) {
            // The map padding below already keeps the bottom clear, and the map adds the two together.
            map.current?.fitToCoordinates(route, { edgePadding: { top: insets.top, right: 48, bottom: 48, left: 48 }, animated: true });
        }
    };

    // Refit only when the route changes, not on every car position update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(fitRoute, [routeKey]);

    return (
        <MapView
            ref={map}
            onMapReady={fitRoute}
            // Keeps the map provider's logo and legal link above the floating cards.
            mapPadding={{ top: 0, right: 0, bottom: insets.bottom, left: 0 }}
            style={StyleSheet.absoluteFill}
            userInterfaceStyle={scheme === 'dark' ? 'dark' : 'light'}
            initialRegion={{ ...center, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
            showsCompass={false}
            toolbarEnabled={false}
        >
            {route?.length ? <Polyline coordinates={route} strokeColor={theme.route.val} strokeWidth={6} lineJoin='round' lineCap='round' /> : null}
            {showRider ? (
                <Marker coordinate={center} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                    <YStack width={60} height={60} borderRadius={30} backgroundColor='$halo' alignItems='center' justifyContent='center'>
                        <YStack width={20} height={20} borderRadius={10} backgroundColor='$route' borderWidth={4} borderColor='$surface' />
                    </YStack>
                </Marker>
            ) : null}
            {pickup ? (
                <Marker coordinate={pickup} anchor={{ x: 0.5, y: 0.5 }} title='Pickup' tracksViewChanges={false}>
                    <YStack width={22} height={22} borderRadius={11} backgroundColor='$surface' borderWidth={5} borderColor='$route' />
                </Marker>
            ) : null}
            {dropoff ? (
                <Marker coordinate={dropoff} anchor={{ x: 0.5, y: 0.5 }} title='Dropoff' tracksViewChanges={false}>
                    <YStack width={22} height={22} borderRadius={11} backgroundColor='$route' borderWidth={3} borderColor='$surface' />
                </Marker>
            ) : null}
            {car ? (
                <Marker coordinate={car} anchor={{ x: 0.5, y: 0.5 }} title='Your driver' tracksViewChanges={false}>
                    <YStack width={38} height={38} borderRadius={19} backgroundColor='$accent' borderWidth={3} borderColor='$surface' alignItems='center' justifyContent='center'>
                        <Icon name='car' size={20} color={theme.on.val} />
                    </YStack>
                </Marker>
            ) : null}
        </MapView>
    );
}
