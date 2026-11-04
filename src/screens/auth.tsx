import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { YStack } from 'tamagui';
import { BrandLogo } from '../branding/BrandLogo';
import { NotConfiguredError } from '../services/fleetbase';
import { useApp } from '../state/AppContext';
import { Banner, Button, Field, Screen, T } from '../ui';

/** R2 and R3. Verification stays on one screen, so going back never loses the number. */
export function SignInScreen() {
    const { service, signIn } = useApp();
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string>();

    const sendCode = async () => {
        setBusy(true);
        setError(undefined);
        try {
            await service.requestCode(phone);
            setCodeSent(true);
        } catch (cause) {
            setError(cause instanceof NotConfiguredError ? cause.message : "We couldn't send a code. Check the number and try again.");
        } finally {
            setBusy(false);
        }
    };

    const verify = async () => {
        setBusy(true);
        setError(undefined);
        try {
            signIn(await service.verifyCode(phone, code));
        } catch {
            setError("That code isn't right. Check it and try again.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Screen>
                <BrandLogo />
                {codeSent ? (
                    <>
                        <T variant='display'>Enter your code</T>
                        <T tone='$sub'>Sent to {phone}</T>
                        <Field label='Verification code' value={code} onChangeText={setCode} keyboardType='number-pad' placeholder='6 digits' textContentType='oneTimeCode' autoFocus />
                    </>
                ) : (
                    <>
                        <T variant='display'>Get a ride in minutes</T>
                        <T tone='$sub'>Enter your phone number and we'll text you a code.</T>
                        <Field label='Phone number' value={phone} onChangeText={setPhone} keyboardType='phone-pad' placeholder='+1 555 0142' textContentType='telephoneNumber' />
                    </>
                )}
                {error ? <Banner text={error} tone='danger' /> : null}
                <YStack flex={1} />
                {codeSent ? <Button label='Verify' onPress={verify} loading={busy} disabled={code.length < 4} /> : <Button label='Continue' onPress={sendCode} loading={busy} disabled={phone.length < 5} />}
            </Screen>
        </KeyboardAvoidingView>
    );
}
