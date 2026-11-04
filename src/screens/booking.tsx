import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { useTheme, XStack, YStack } from 'tamagui';
import { BrandLogo } from '../branding/BrandLogo';
import { componentSlot } from '../extensions/components/component-slot';
import type { ComponentPropsMap } from '../extensions/components/types';
import type { RootStack } from '../navigation';
import type { PaymentMethod, Place, Quote } from '../services/types';
import { useApp } from '../state/AppContext';
import { Banner, BottomStack, Button, Card, Field, floating, Icon, RoundButton, Row, Screen, T, TopStack } from '../ui';
import { RideMap } from '../ui/RideMap';

const FALLBACK_CENTER = { latitude: 1.2847, longitude: 103.8511 };

const ClassCard = componentSlot('booking.classCard', function DefaultClassCard({ quote, index, selected, onPress }: ComponentPropsMap['booking.classCard']) {
    const theme = useTheme();
    return (
        <Pressable style={{ flex: 1 }} accessibilityRole='radio' accessibilityState={{ selected }} onPress={onPress}>
            <YStack borderRadius={24} backgroundColor='$surface' borderWidth={3} borderColor={selected ? '$route' : 'transparent'} padding={16} gap={6} {...floating}>
                <Icon name={index === 0 ? 'car' : 'van'} size={44} color={selected ? theme.route.val : theme.sub.val} />
                <T variant='action'>{quote?.className ?? ' '}</T>
                <T variant='secondary' tone='$sub'>{quote ? `${quote.seats} seats · ${quote.pickupMinutes} min` : ' '}</T>
                {quote ? <T variant='title' style={{ fontVariant: ['tabular-nums'] }}>{quote.fare}</T> : <YStack width={90} height={32} borderRadius={8} backgroundColor='$raised' />}
                <T variant='caption' tone='$sub'>Estimated fare</T>
            </YStack>
        </Pressable>
    );
});

/** R7. */
export function HomeScreen({ navigation }: NativeStackScreenProps<RootStack, 'Home'>) {
    const { service, profile, setDropoff } = useApp();
    const theme = useTheme();
    const [pickup, setPickup] = useState<Place>();
    const [saved, setSaved] = useState<Place[]>([]);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        service.currentPickup().then(setPickup).catch(() => setFailed(true));
    }, [service]);

    // Saved places can change on the account screens.
    useFocusEffect(
        useCallback(() => {
            service.savedPlaces().then(setSaved).catch(() => setFailed(true));
        }, [service])
    );

    const goTo = (place: Place) => {
        setDropoff(place);
        navigation.navigate('Choose');
    };

    return (
        <YStack flex={1}>
            <RideMap center={pickup?.location ?? FALLBACK_CENTER} showRider />
            <TopStack>
                <XStack justifyContent='space-between' alignItems='center'>
                    <YStack height={48} paddingHorizontal={18} borderRadius={24} backgroundColor='$surface' justifyContent='center' {...floating}>
                        <BrandLogo />
                    </YStack>
                    <RoundButton icon='user' label='Account' onPress={() => navigation.navigate('Account')} />
                </XStack>
            </TopStack>
            <BottomStack>
                {failed ? <Banner tone='danger' text="We couldn't load your location or places. Check your connection and try again." /> : null}
                <XStack gap={8}>
                    {saved.slice(0, 2).map((place) => (
                        <Pressable key={place.id} style={{ flex: 1 }} accessibilityRole='button' onPress={() => goTo(place)}>
                            <XStack height={72} borderRadius={24} backgroundColor='$surface' alignItems='center' gap={10} paddingHorizontal={14} {...floating}>
                                <YStack width={40} height={40} borderRadius={20} backgroundColor='$tint' alignItems='center' justifyContent='center'>
                                    <Icon name={place.saved === 'home' ? 'home' : place.saved === 'work' ? 'work' : 'pin'} size={20} color={theme.ink.val} />
                                </YStack>
                                <YStack flex={1}>
                                    <T variant='strong' fontWeight='700'>{place.name}</T>
                                    <T variant='caption' tone='$sub' fontWeight='400' numberOfLines={1}>{place.detail}</T>
                                </YStack>
                            </XStack>
                        </Pressable>
                    ))}
                </XStack>
                <Card>
                    <T variant='title'>Where are you going{profile ? `, ${profile.firstName}` : ''}?</T>
                    <Pressable accessibilityRole='button' onPress={() => navigation.navigate('Destination')}>
                        <XStack height={60} borderRadius={30} backgroundColor='$accent' alignItems='center' gap={12} paddingHorizontal={20}>
                            <Icon name='search' color={theme.on.val} />
                            <T variant='action' tone='$on'>Where to?</T>
                        </XStack>
                    </Pressable>
                </Card>
            </BottomStack>
        </YStack>
    );
}

/** R8. */
export function DestinationScreen({ navigation }: NativeStackScreenProps<RootStack, 'Destination'>) {
    const { service, setDropoff } = useApp();
    const [pickup, setPickup] = useState<Place>();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Place[]>([]);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        service.currentPickup().then(setPickup).catch(() => setFailed(true));
    }, [service]);

    useEffect(() => {
        let current = true;
        service
            .searchPlaces(query)
            .then((places) => {
                if (current) {
                    setFailed(false);
                    setResults(places);
                }
            })
            .catch(() => current && setFailed(true));
        return () => {
            current = false;
        };
    }, [service, query]);

    return (
        <Screen>
            <XStack>
                <RoundButton icon='back' label='Back' onPress={navigation.goBack} />
            </XStack>
            <Field label='Pickup' value={pickup?.name ?? ''} editable={false} />
            <Field label='Dropoff' value={query} onChangeText={setQuery} placeholder='Where to?' autoFocus autoCorrect={false} />
            <ScrollView keyboardShouldPersistTaps='handled'>
                {results.map((place, index) => (
                    <Row
                        key={place.id}
                        title={place.name}
                        subtitle={place.detail}
                        icon={place.saved === 'home' ? 'home' : place.saved === 'work' ? 'work' : 'pin'}
                        last={index === results.length - 1}
                        onPress={() => {
                            setDropoff(place);
                            navigation.navigate('Choose');
                        }}
                    />
                ))}
                {failed ? <Banner tone='danger' text="We couldn't search for places. Check your connection and try again." /> : null}
                {!failed && results.length === 0 ? <T tone='$sub'>No places found. Check the spelling and try again.</T> : null}
            </ScrollView>
        </Screen>
    );
}

/** R10. Selecting a class only highlights it; requesting is always the one main action. */
export function ChooseScreen({ navigation }: NativeStackScreenProps<RootStack, 'Choose'>) {
    const { service, dropoff, requestRide } = useApp();
    const theme = useTheme();
    const [pickup, setPickup] = useState<Place>();
    const [quotes, setQuotes] = useState<Quote[]>();
    const [selected, setSelected] = useState<string>();
    const [payment, setPayment] = useState<PaymentMethod>('cash');
    const [busy, setBusy] = useState(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        service
            .currentPickup()
            .then(async (place) => {
                setPickup(place);
                if (dropoff) {
                    const found = await service.quotes(place, dropoff);
                    setQuotes(found);
                    setSelected(found[0]?.id);
                }
            })
            .catch(() => setFailed(true));
    }, [service, dropoff]);

    const quote = quotes?.find((item) => item.id === selected);

    const request = async () => {
        if (!pickup || !quote) {
            return;
        }
        setBusy(true);
        await requestRide({ pickup, quote, payment });
        setBusy(false);
        navigation.reset({ index: 0, routes: [{ name: 'Ride' }] });
    };

    return (
        <YStack flex={1}>
            <RideMap
                center={pickup?.location ?? FALLBACK_CENTER}
                pickup={pickup?.location}
                dropoff={dropoff?.location}
                route={pickup && dropoff ? [pickup.location, { latitude: dropoff.location.latitude, longitude: pickup.location.longitude }, dropoff.location] : undefined}
                insets={{ top: 130, bottom: 410 }}
            />
            <TopStack>
                <XStack gap={12} alignItems='center'>
                    <RoundButton icon='back' label='Back' onPress={navigation.goBack} />
                    <YStack flex={1} height={48} paddingHorizontal={16} borderRadius={24} backgroundColor='$surface' justifyContent='center' {...floating}>
                        <T variant='secondary' fontWeight='600' numberOfLines={1}>{pickup?.name} → {dropoff?.name}</T>
                    </YStack>
                </XStack>
            </TopStack>
            <BottomStack>
                {failed ? <Banner tone='danger' text="We couldn't get fares for this trip. Go back and try again." /> : null}
                <XStack gap={10}>
                    {(quotes ?? [undefined, undefined]).map((item, index) => {
                        return <ClassCard key={item?.id ?? index} quote={item} index={index} selected={item ? item.id === selected : false} onPress={() => item && setSelected(item.id)} />;
                    })}
                </XStack>
                <Card padding={12} gap={8}>
                    <Pressable accessibilityRole='button' accessibilityLabel='Change payment method' onPress={() => setPayment(payment === 'cash' ? 'card' : 'cash')}>
                        <XStack minHeight={48} alignItems='center' gap={10} paddingHorizontal={8}>
                            <Icon name={payment === 'cash' ? 'cash' : 'card'} color={theme.text.val} />
                            <T variant='strong' flex={1}>{payment === 'cash' ? 'Pay with cash' : 'Pay by card after the trip'}</T>
                            <T variant='secondary' tone='$sub' fontWeight='600'>Change</T>
                        </XStack>
                    </Pressable>
                    <Button label={quote ? `Request ${quote.className}` : 'Getting fares'} onPress={request} disabled={!quote} loading={busy} />
                </Card>
            </BottomStack>
        </YStack>
    );
}
