import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, TextInput } from 'react-native';
import { useTheme, XStack, YStack } from 'tamagui';
import { branding as brand, fontFace } from '../branding';
import { componentSlot } from '../extensions/components/component-slot';
import type { ComponentPropsMap } from '../extensions/components/types';
import type { RootStack } from '../navigation';
import type { Checkout, PaymentResult } from '../services/types';
import { useApp } from '../state/AppContext';
import { Avatar, Banner, BottomStack, Button, Card, Icon, Lines, Plate, Row, Screen, T, TopStack } from '../ui';
import { HostedCheckout } from '../ui/HostedCheckout';
import { RideMap } from '../ui/RideMap';
import { share } from '../utils/share';

const DriverCard = componentSlot('ride.driverCard', ({ driver, compact }: ComponentPropsMap['ride.driverCard']) => (
    <XStack alignItems='center' gap={12}>
        <Avatar initials={driver.initials} size={compact ? 52 : 60} />
        <YStack flex={1}>
            <T variant='action'>{driver.name}</T>
            <T variant='secondary' tone='$sub'>★ {driver.rating} · {compact ? driver.plate : driver.vehicle}</T>
        </YStack>
    </XStack>
));

/** R13, R14, R16, R17, R18 and R18s. One screen, because the map stays put as the status changes. */
export function RideScreen({ navigation }: NativeStackScreenProps<RootStack, 'Ride'>) {
    const { service, ride, cancelRide } = useApp();
    const [safety, setSafety] = useState(false);
    const [shareNote, setShareNote] = useState<{ text: string; tone: 'ok' | 'danger' }>();

    useEffect(() => {
        if (ride?.status === 'completed') {
            navigation.reset({ index: 0, routes: [{ name: 'Pay' }] });
        }
    }, [ride?.status, navigation]);

    if (!ride) {
        return null;
    }

    const cancel = async () => {
        await cancelRide();
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    };

    const shareTrip = async () => {
        try {
            const link = await service.shareLink(ride.id);
            const outcome = await share(`Follow my ${brand.name} trip to ${ride.dropoff.name}: ${link}`);
            setShareNote(outcome === 'copied' ? { text: 'Trip link copied. Paste it to someone you trust.', tone: 'ok' } : undefined);
        } catch {
            setShareNote({ text: "We couldn't share your trip. Try again.", tone: 'danger' });
        }
    };

    const { status, driver } = ride;
    const onTrip = status === 'in_progress';
    const hasDriver = status === 'driver_en_route' || status === 'arrived' || onTrip;

    return (
        <YStack flex={1}>
            <RideMap
                center={ride.pickup.location}
                showRider={status === 'searching'}
                pickup={hasDriver && !onTrip ? ride.pickup.location : undefined}
                dropoff={onTrip ? ride.dropoff.location : undefined}
                route={hasDriver ? ride.route : undefined}
                car={hasDriver ? ride.carPosition : undefined}
                insets={{ top: 150, bottom: 360 }}
            />

            {status === 'driver_en_route' ? (
                <TopStack>
                    <Card paddingVertical={14} gap={2}>
                        <T variant='title' style={{ fontVariant: ['tabular-nums'] }}>Arriving in {ride.etaMinutes} min</T>
                        <T variant='secondary' tone='$sub'>Pickup at {ride.pickup.name}</T>
                    </Card>
                </TopStack>
            ) : null}
            {status === 'arrived' && driver ? (
                <TopStack>
                    <Card backgroundColor='$accent' paddingVertical={16} gap={2}>
                        <T variant='title' tone='$on'>{driver.name.split(' ')[0]} is here</T>
                        <T variant='secondary' tone='$on'>Waiting at the pickup point on {ride.pickup.name}</T>
                    </Card>
                </TopStack>
            ) : null}
            {onTrip ? (
                <TopStack>
                    <Card paddingVertical={14} gap={2}>
                        <T variant='title' style={{ fontVariant: ['tabular-nums'] }}>{ride.etaMinutes} min to go</T>
                        <T variant='secondary' tone='$sub'>Heading to {ride.dropoff.name}</T>
                    </Card>
                </TopStack>
            ) : null}

            <BottomStack>
                {shareNote ? <Banner text={shareNote.text} tone={shareNote.tone} /> : null}
                {safety ? (
                    <Card>
                        <T variant='title'>Your safety</T>
                        <T tone='$sub'>Your trip is being tracked. If you're in danger, call emergency services.</T>
                        <YStack>
                            <Row title='Call emergency services' subtitle={brand.emergencyNumber} icon='phone' onPress={() => Linking.openURL(`tel:${brand.emergencyNumber}`)} />
                            <Row title='Share trip' subtitle='Send a live link to someone you trust' icon='share' onPress={shareTrip} last={!brand.support?.phone} />
                            {brand.support?.phone ? <Row title={`Contact ${brand.name}`} subtitle='Get help with this trip' icon='help' onPress={() => Linking.openURL(`tel:${brand.support?.phone}`)} last /> : null}
                        </YStack>
                        <Button label='Close' kind='second' onPress={() => setSafety(false)} />
                    </Card>
                ) : (
                <Card>
                    {status === 'searching' ? (
                        <>
                            <T variant='title'>Finding your driver</T>
                            <T tone='$sub'>Pickup at {ride.pickup.name}. Estimated fare {ride.quote.fare}.</T>
                            <Button label='Cancel request' kind='second' onPress={cancel} />
                        </>
                    ) : null}

                    {status === 'no_driver' ? (
                        <>
                            <T variant='title'>No drivers free right now</T>
                            <T tone='$sub'>You haven't been charged. Try again, or choose another class.</T>
                            <Button label='Choose another class' onPress={cancel} />
                        </>
                    ) : null}

                    {hasDriver && driver ? (
                        <>
                            <DriverCard driver={driver} compact={onTrip} />
                            {onTrip ? (
                                <XStack gap={8}>
                                    <Button label='Share trip' kind='second' flex={1} onPress={shareTrip} />
                                    <Button label='Safety' kind='second' flex={1} onPress={() => setSafety(true)} />
                                </XStack>
                            ) : (
                                <>
                                    <Plate
                                        label={status === 'arrived' ? 'Check the plate before you get in' : 'Look for this plate'}
                                        plate={driver.plate}
                                        size={status === 'arrived' ? 52 : 44}
                                    />
                                    <XStack gap={8}>
                                        <Button label='Cancel' kind='second' flex={1} onPress={cancel} />
                                        <Button label={`Message ${driver.name.split(' ')[0]}`} flex={2} onPress={() => navigation.navigate('Chat')} />
                                    </XStack>
                                </>
                            )}
                        </>
                    ) : null}
                </Card>
                )}
            </BottomStack>
        </YStack>
    );
}

/** R23, R24, R24c and R26. The checkout page itself comes from the payment provider. */
export function PayScreen({ navigation }: NativeStackScreenProps<RootStack, 'Pay'>) {
    const { service, ride } = useApp();
    const [stage, setStage] = useState<'fare' | 'checkout' | 'failed' | 'paid'>('fare');
    const [checkout, setCheckout] = useState<Checkout>();

    if (!ride?.fare) {
        return null;
    }
    const driverName = ride.driver?.name.split(' ')[0] ?? 'your driver';
    const cash = ride.payment === 'cash';
    const rate = () => navigation.reset({ index: 0, routes: [{ name: 'Rate' }] });

    const startCheckout = async () => {
        setCheckout(undefined);
        setStage('checkout');
        try {
            setCheckout(await service.createCheckout(ride.id));
        } catch {
            setStage('failed');
        }
    };

    const finishCheckout = async (reported: PaymentResult) => {
        try {
            setStage(await service.confirmPayment(ride.id, reported));
        } catch {
            setStage('failed');
        }
    };

    if (stage === 'checkout') {
        return (
            <Screen>
                <T variant='caption' tone='$sub'>Secure checkout</T>
                <T variant='title'>Pay {ride.fare.total}</T>
                <YStack flex={1} borderRadius={20} overflow='hidden' borderWidth={1} borderColor='$line'>
                    {checkout ? <HostedCheckout checkout={checkout} onResult={finishCheckout} /> : null}
                </YStack>
                <Button label='Close without paying' kind='ghost' onPress={() => setStage('failed')} />
            </Screen>
        );
    }

    return (
        <Screen>
            <ScrollView contentContainerStyle={{ gap: 14 }}>
                <T variant='title'>{stage === 'paid' ? 'Thanks for riding' : cash ? `Pay ${driverName} in cash` : 'Trip complete'}</T>
                <T variant='glance' style={{ fontVariant: ['tabular-nums'] }}>{ride.fare.total}</T>
                <Lines lines={ride.fare.lines} />
                <T variant='secondary' tone='$sub'>Your estimate was {ride.fare.estimate}. The final fare uses the trip's actual distance and time.</T>
                {stage === 'failed' ? <Banner tone='danger' text="Your payment didn't go through. You'll need to settle this before your next ride." /> : null}
                {stage === 'paid' ? <Banner tone='ok' text='Payment received. Your receipt is ready.' /> : null}
            </ScrollView>
            {stage === 'paid' ? <Button label='View receipt' kind='second' onPress={() => navigation.navigate('Receipt', { tripId: ride.id })} /> : null}
            {stage === 'failed' ? <Button label={`Contact ${brand.name}`} kind='second' onPress={() => navigation.navigate('Help')} /> : null}
            {cash || stage === 'paid' ? (
                <Button label={cash ? "I've paid, rate my ride" : 'Rate my ride'} onPress={rate} />
            ) : (
                <Button label={stage === 'failed' ? 'Try again' : 'Continue to payment'} onPress={startCheckout} />
            )}
        </Screen>
    );
}

/** R27. */
export function RateScreen({ navigation }: NativeStackScreenProps<RootStack, 'Rate'>) {
    const { service, ride, clearRide } = useApp();
    const theme = useTheme();
    const [stars, setStars] = useState(0);
    const [comment, setComment] = useState('');

    const finish = async (submit: boolean) => {
        if (submit && ride) {
            await service.rateDriver(ride.id, stars, comment);
        }
        clearRide();
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    };

    const first = ride?.driver?.name.split(' ')[0] ?? 'your driver';

    return (
        <Screen alignItems='center'>
            <Avatar initials={ride?.driver?.initials ?? ''} size={88} />
            <T variant='title' textAlign='center'>How was your ride with {first}?</T>
            <XStack gap={4}>
                {[1, 2, 3, 4, 5].map((value) => (
                    <Pressable key={value} accessibilityRole='button' accessibilityLabel={`${value} stars`} onPress={() => setStars(value)} style={{ padding: 5 }}>
                        <Icon name='star' size={46} color={value <= stars ? '#F5A623' : theme.sub.val} fill={value <= stars ? '#F5A623' : 'none'} />
                    </Pressable>
                ))}
            </XStack>
            <TextInput
                accessibilityLabel='Comment'
                value={comment}
                onChangeText={setComment}
                placeholder='Add a comment (optional)'
                placeholderTextColor={theme.sub.val}
                style={{ alignSelf: 'stretch', height: 60, borderRadius: 18, backgroundColor: theme.raised.val, color: theme.text.val, paddingHorizontal: 16, fontFamily: fontFace('500'), fontSize: 16 }}
            />
            <YStack flex={1} />
            <YStack alignSelf='stretch' gap={6}>
                <Button label='Submit' onPress={() => finish(true)} disabled={stars === 0} />
                <Button label='Skip' kind='ghost' onPress={() => finish(false)} />
            </YStack>
        </Screen>
    );
}
