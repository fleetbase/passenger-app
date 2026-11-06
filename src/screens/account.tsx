import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, ScrollView } from 'react-native';
import { YStack } from 'tamagui';
import { branding as brand } from '../branding';
import type { RootStack } from '../navigation';
import { failureText } from '../services/errors';
import { getBuildExtensions } from '../extensions/build-extensions';
import { useApp, type Appearance } from '../state/AppContext';
import { Banner, Button, Field, Header, Row, Screen, T } from '../ui';

const APPEARANCES: { value: Appearance; label: string }[] = [
    { value: 'system', label: 'Match device' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
];

/** R32, plus the way into trips, saved places and help. */
export function AccountScreen({ navigation }: NativeStackScreenProps<RootStack, 'Account'>) {
    const { profile, signOut, appearance, setAppearance } = useApp();
    if (!profile) {
        return null;
    }
    const current = APPEARANCES.findIndex((item) => item.value === appearance);
    const next = APPEARANCES[(current + 1) % APPEARANCES.length];
    return (
        <Screen>
            <Header title='Account' onBack={navigation.goBack} />
            <ScrollView style={{ flex: 1 }}>
                <Row title={`${profile.firstName} ${profile.lastName}`.trim()} subtitle={profile.phone} icon='user' trailing='Edit' onPress={() => navigation.navigate('EditProfile')} />
                <Row title='Your trips' subtitle='History and receipts' icon='clock' onPress={() => navigation.navigate('Trips')} />
                <Row title='Saved places' subtitle='Home, work and more' icon='pin' onPress={() => navigation.navigate('Places')} />
                {brand.appearance.allowUserToggle ? <Row title='Appearance' subtitle={APPEARANCES[current].label} icon='moon' trailing='Change' onPress={() => setAppearance(next.value)} /> : null}
                {getBuildExtensions().accountLinks?.map((link) => <Row key={link.route} title={link.label} subtitle={link.subtitle} icon='star' onPress={() => navigation.navigate(link.route as never)} />)}
                <Row title='Help' subtitle={`Contact ${brand.name}`} icon='help' onPress={() => navigation.navigate('Help')} />
                <Row title='Delete account' subtitle='Removes your account and data' icon='trash' danger last onPress={() => navigation.navigate('DeleteAccount')} />
            </ScrollView>
            <Button label='Sign out' kind='second' onPress={signOut} />
        </Screen>
    );
}

export function EditProfileScreen({ navigation }: NativeStackScreenProps<RootStack, 'EditProfile'>) {
    const { profile, updateProfile } = useApp();
    const [firstName, setFirstName] = useState(profile?.firstName ?? '');
    const [lastName, setLastName] = useState(profile?.lastName ?? '');
    const [email, setEmail] = useState(profile?.email ?? '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string>();

    if (!profile) {
        return null;
    }

    const save = async () => {
        setBusy(true);
        setError(undefined);
        try {
            await updateProfile({ ...profile, firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() || undefined });
            navigation.goBack();
        } catch {
            setError("We couldn't save your details. Try again.");
            setBusy(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Screen>
                <Header title='Your details' onBack={navigation.goBack} />
                <Field label='First name' value={firstName} onChangeText={setFirstName} textContentType='givenName' />
                <Field label='Last name' value={lastName} onChangeText={setLastName} textContentType='familyName' />
                <Field label='Email (optional)' value={email} onChangeText={setEmail} keyboardType='email-address' autoCapitalize='none' autoCorrect={false} textContentType='emailAddress' />
                <Field label='Phone number' value={profile.phone} editable={false} />
                {error ? <Banner tone='danger' text={error} /> : null}
                <YStack flex={1} />
                <Button label='Save' onPress={save} loading={busy} disabled={!firstName.trim()} />
            </Screen>
        </KeyboardAvoidingView>
    );
}

/** R32d. */
export function DeleteAccountScreen({ navigation }: NativeStackScreenProps<RootStack, 'DeleteAccount'>) {
    const { deleteAccount } = useApp();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string>();

    const confirm = async () => {
        setBusy(true);
        setError(undefined);
        try {
            await deleteAccount();
        } catch (cause) {
            setError(failureText(cause, "We couldn't delete your account. Try again."));
            setBusy(false);
        }
    };

    return (
        <Screen>
            <Header title='Delete your account?' onBack={navigation.goBack} />
            <T tone='$sub'>This removes your profile and saved places, and you'll lose access to your trip history. You can't undo this.</T>
            {error ? <Banner tone='danger' text={error} /> : null}
            <YStack flex={1} />
            <Button label='Delete account' kind='danger' onPress={confirm} loading={busy} />
            <Button label='Keep my account' kind='second' onPress={navigation.goBack} disabled={busy} />
        </Screen>
    );
}

/** R33. From the operator's ride settings, else their brand file. */
export function HelpScreen({ navigation }: NativeStackScreenProps<RootStack, 'Help'>) {
    const { contacts } = useApp();
    const { supportPhone: phone, supportEmail: email } = contacts;
    const termsUrl = brand.support?.termsUrl;
    return (
        <Screen>
            <Header title='Help' onBack={navigation.goBack} />
            <T tone='$sub'>Contact {brand.name} for help with a trip or your account.</T>
            <ScrollView style={{ flex: 1 }}>
                {phone ? <Row title={`Call ${brand.name}`} subtitle={phone} icon='phone' onPress={() => Linking.openURL(`tel:${phone}`)} /> : null}
                {email ? <Row title='Email support' subtitle={email} icon='mail' onPress={() => Linking.openURL(`mailto:${email}`)} /> : null}
                <Row title='Lost something?' subtitle='Get help with a past trip' icon='car' onPress={() => navigation.navigate('Trips')} />
                {termsUrl ? <Row title='Terms and privacy' icon='doc' onPress={() => Linking.openURL(termsUrl)} last /> : null}
            </ScrollView>
        </Screen>
    );
}
