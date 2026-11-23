import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Linking, ScrollView } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { branding as brand } from '../branding';
import { componentSlot } from '../extensions/components/component-slot';
import type { ComponentPropsMap } from '../extensions/components/types';
import type { RootStack } from '../navigation';
import type { Trip } from '../services/types';
import { useApp } from '../state/AppContext';
import { Avatar, Banner, BottomStack, Button, Card, Header, Lines, RoundButton, Row, Screen, T, TopStack } from '../ui';
import { RideMap } from '../ui/RideMap';
import { formatDate, formatDay } from '../utils/format';
import { share } from '../utils/share';

const withClass = (trip: Trip) => [formatDate(trip.date), trip.className].filter(Boolean).join(' · ');

const TripRow = componentSlot('trips.row', ({ trip, last, onPress }: ComponentPropsMap['trips.row']) => (
    <Row
        testID='trip-row'
        title={trip.dropoff.name}
        subtitle={trip.status === 'canceled' ? `Canceled · ${formatDay(trip.date)}` : withClass(trip)}
        icon={trip.className === 'XL' ? 'van' : 'car'}
        trailing={trip.fare?.total ?? (trip.status === 'canceled' ? 'No charge' : undefined)}
        last={last}
        onPress={onPress}
    />
));

/** R29 and its empty state. */
export function TripsScreen({ navigation }: NativeStackScreenProps<RootStack, 'Trips'>) {
    const { service } = useApp();
    const [trips, setTrips] = useState<Trip[]>();
    const [failed, setFailed] = useState(false);

    useFocusEffect(
        useCallback(() => {
            service.trips().then(setTrips).catch(() => setFailed(true));
        }, [service])
    );

    return (
        <Screen>
            <Header title='Your trips' onBack={navigation.goBack} />
            {failed ? <Banner tone='danger' text="We couldn't load your trips. Check your connection and try again." /> : null}
            {!trips && !failed ? <T tone='$sub'>Loading your trips…</T> : null}
            {trips?.length === 0 ? (
                <YStack flex={1} alignItems='center' justifyContent='center' gap={8}>
                    <T variant='title' textAlign='center'>No trips yet</T>
                    <T tone='$sub' textAlign='center'>Your rides and receipts will show up here.</T>
                    <YStack alignSelf='stretch' paddingTop={12}>
                        <Button label='Book a ride' onPress={() => navigation.popToTop()} />
                    </YStack>
                </YStack>
            ) : (
                <ScrollView>
                    {trips?.map((trip, index) => (
                        <TripRow key={trip.id} trip={trip} last={index === trips.length - 1} onPress={() => navigation.navigate('Trip', { tripId: trip.id })} />
                    ))}
                </ScrollView>
            )}
        </Screen>
    );
}

function useTrip(tripId: string) {
    const { service } = useApp();
    const [trip, setTrip] = useState<Trip>();
    const [failed, setFailed] = useState(false);
    useFocusEffect(
        useCallback(() => {
            service
                .trip(tripId)
                .then((found) => {
                    setTrip(found);
                    setFailed(!found);
                })
                .catch(() => setFailed(true));
        }, [service, tripId])
    );
    return { trip, failed };
}

/** Keeps a way back while a trip loads or if it can't be loaded. */
function TripPlaceholder({ title, failed, onBack }: { title: string; failed: boolean; onBack: () => void }) {
    return (
        <Screen>
            <Header title={title} onBack={onBack} />
            {failed ? <Banner tone='danger' text="We couldn't load this trip. Check your connection and try again." /> : <T tone='$sub'>Loading…</T>}
        </Screen>
    );
}

/** R30. */
export function TripScreen({ navigation, route }: NativeStackScreenProps<RootStack, 'Trip'>) {
    const { trip, failed } = useTrip(route.params.tripId);
    if (!trip) {
        return <TripPlaceholder title='Trip' failed={failed} onBack={navigation.goBack} />;
    }
    return (
        <YStack flex={1}>
            <RideMap center={trip.pickup.location} pickup={trip.pickup.location} dropoff={trip.dropoff.location} route={trip.route} insets={{ top: 100, bottom: 360 }} />
            <TopStack>
                <XStack>
                    <RoundButton icon='back' label='Back' onPress={navigation.goBack} testID='back' />
                </XStack>
            </TopStack>
            <BottomStack>
                <Card testID='trip-details'>
                    <YStack>
                        <T variant='caption' tone='$sub'>{formatDate(trip.date)}</T>
                        <T variant='title'>{trip.dropoff.name}</T>
                    </YStack>
                    {trip.driver ? (
                        <XStack alignItems='center' gap={12}>
                            <Avatar initials={trip.driver.initials} size={52} />
                            <YStack flex={1}>
                                <T variant='action'>{trip.driver.name}</T>
                                <T variant='secondary' tone='$sub'>{trip.driver.vehicle} · {trip.driver.plate}</T>
                            </YStack>
                        </XStack>
                    ) : null}
                    {trip.fare ? (
                        <Lines lines={trip.summary ? [{ label: 'Distance and time', amount: trip.summary }] : []} total={{ label: 'Final fare', amount: trip.fare.total }} />
                    ) : (
                        <T tone='$sub'>{trip.status === 'canceled' ? "This ride was canceled. You weren't charged." : "The fare for this trip isn't available."}</T>
                    )}
                    <XStack gap={8}>
                        {trip.fare ? <Button testID='trip-receipt' label='Receipt' kind='second' flex={1} onPress={() => navigation.navigate('Receipt', { tripId: trip.id })} /> : null}
                        <Button label='Get help' kind='second' flex={1} onPress={() => navigation.navigate('Help')} />
                    </XStack>
                </Card>
            </BottomStack>
        </YStack>
    );
}

/** R28. */
export function ReceiptScreen({ navigation, route }: NativeStackScreenProps<RootStack, 'Receipt'>) {
    const { trip, failed } = useTrip(route.params.tripId);
    const [note, setNote] = useState<{ text: string; tone: 'ok' | 'danger' }>();
    if (!trip?.fare) {
        return <TripPlaceholder title='Receipt' failed={failed || Boolean(trip)} onBack={navigation.goBack} />;
    }
    const { fare } = trip;
    // Fleet-Ops doesn't record how a trip was paid until M6, so don't claim anything until then.
    const totalLabel = trip.paid === undefined ? 'Total' : trip.paid ? 'Total paid' : 'Total owed';
    const paidWith = !trip.payment ? undefined : trip.payment === 'cash' ? 'Paid with cash' : trip.paid ? 'Paid by card' : 'Card payment not completed';

    const shareReceipt = async () => {
        const text = [
            `${brand.name} receipt`,
            withClass(trip),
            `${trip.pickup.name} to ${trip.dropoff.name}`,
            ...fare.lines.map((line) => `${line.label}: ${line.amount}`),
            `${totalLabel}: ${fare.total}`,
            ...(paidWith ? [paidWith] : []),
        ].join('\n');
        try {
            const outcome = await share(text);
            setNote(outcome === 'copied' ? { text: 'Receipt copied.', tone: 'ok' } : undefined);
        } catch {
            setNote({ text: "We couldn't share your receipt. Try again.", tone: 'danger' });
        }
    };

    return (
        <Screen>
            <Header title='Receipt' onBack={navigation.goBack} />
            <ScrollView contentContainerStyle={{ gap: 14 }}>
                <T tone='$sub'>{withClass(trip)}</T>
                <YStack testID='receipt-lines'>
                    <Lines lines={fare.lines} total={{ label: totalLabel, amount: fare.total }} />
                </YStack>
                <YStack>
                    {paidWith ? <Row title={paidWith} icon={trip.payment === 'cash' ? 'cash' : 'card'} /> : null}
                    <Row title={trip.pickup.name} subtitle={`to ${trip.dropoff.name}`} icon='pin' last />
                </YStack>
                {note ? <Banner text={note.text} tone={note.tone} /> : null}
            </ScrollView>
            <Button label='Share receipt' kind='second' onPress={shareReceipt} />
            {brand.support?.email ? <Button label='Report a problem' kind='ghost' onPress={() => Linking.openURL(`mailto:${brand.support?.email}?subject=${encodeURIComponent(`Trip on ${formatDay(trip.date)}`)}`)} /> : null}
        </Screen>
    );
}
