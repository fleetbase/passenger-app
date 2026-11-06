import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { YStack } from 'tamagui';
import type { RootStack } from '../navigation';
import { failureText } from '../services/errors';
import type { Place } from '../services/types';
import { useApp } from '../state/AppContext';
import { Banner, Button, Field, Header, Row, Screen, T } from '../ui';

/** R31. */
export function PlacesScreen({ navigation }: NativeStackScreenProps<RootStack, 'Places'>) {
    const { service } = useApp();
    const [places, setPlaces] = useState<Place[]>();
    const [failed, setFailed] = useState(false);

    useFocusEffect(
        useCallback(() => {
            service.savedPlaces().then(setPlaces).catch(() => setFailed(true));
        }, [service])
    );

    return (
        <Screen>
            <Header title='Saved places' onBack={navigation.goBack} />
            {failed ? <Banner tone='danger' text="We couldn't load your places. Check your connection and try again." /> : null}
            <ScrollView style={{ flex: 1 }}>
                {places?.length === 0 ? <T tone='$sub'>Save the places you go most, so booking takes one tap.</T> : null}
                {places?.map((place, index) => (
                    <Row
                        key={place.id}
                        title={place.name}
                        subtitle={place.detail}
                        icon={place.saved === 'home' ? 'home' : place.saved === 'work' ? 'work' : 'pin'}
                        trailing='Edit'
                        last={index === places.length - 1}
                        onPress={() => navigation.navigate('EditPlace', { placeId: place.id })}
                    />
                ))}
            </ScrollView>
            <Button label='Add a place' kind='second' onPress={() => navigation.navigate('EditPlace', {})} />
        </Screen>
    );
}

/** R31e, also used to add a place. */
export function EditPlaceScreen({ navigation, route }: NativeStackScreenProps<RootStack, 'EditPlace'>) {
    const { service } = useApp();
    const { placeId } = route.params;
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string>();

    useEffect(() => {
        if (placeId) {
            service.savedPlaces().then((places) => {
                const place = places.find((item) => item.id === placeId);
                setName(place?.name ?? '');
                setAddress(place?.detail ?? '');
            });
        }
    }, [service, placeId]);

    const attempt = async (action: () => Promise<unknown>, failure: string) => {
        setBusy(true);
        setError(undefined);
        try {
            await action();
            navigation.goBack();
        } catch (cause) {
            setError(failureText(cause, failure));
            setBusy(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Screen>
                <Header title={placeId ? 'Edit place' : 'Add a place'} onBack={navigation.goBack} />
                <Field label='Name' value={name} onChangeText={setName} placeholder='Gym' />
                <Field label='Address' value={address} onChangeText={setAddress} placeholder='7 Mill Lane' />
                {error ? <Banner tone='danger' text={error} /> : null}
                <YStack flex={1} />
                <Button
                    label='Save'
                    loading={busy}
                    disabled={!name.trim() || !address.trim()}
                    onPress={() => attempt(() => service.savePlace({ id: placeId, name: name.trim(), address: address.trim() }), "We couldn't save this place. Try again.")}
                />
                {placeId ? <Button label='Delete place' kind='danger' disabled={busy} onPress={() => attempt(() => service.deletePlace(placeId), "We couldn't delete this place. Try again.")} /> : null}
            </Screen>
        </KeyboardAvoidingView>
    );
}
