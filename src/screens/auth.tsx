import React, { useState } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { YStack } from 'tamagui';
import { BrandLogo } from '../branding/BrandLogo';
import { failureText } from '../services/errors';
import { useApp } from '../state/AppContext';
import { Banner, Button, Field, Screen, T } from '../ui';

/** R2 and R3. Verification stays on one screen, so going back never loses the number. */
export function SignInScreen() {
    const { service, signIn } = useApp();
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [newRider, setNewRider] = useState(false);
    const [name, setName] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string>();

    const sendCode = async () => {
        setBusy(true);
        setError(undefined);
        try {
            await service.requestCode(phone);
            setCodeSent(true);
        } catch (cause) {
            setError(failureText(cause, "We couldn't send a code. Check the number and try again."));
        } finally {
            setBusy(false);
        }
    };

    const verify = async () => {
        setBusy(true);
        setError(undefined);
        try {
            const result = await service.verifyCode(phone, code, newRider ? name.trim() : undefined);
            if (result === 'needs-name') {
                setNewRider(true);
            } else {
                signIn(result);
            }
        } catch (cause) {
            // The API answers 400 for a wrong code. Anything else is the network or the server.
            setError((cause as { status?: number }).status === 400 ? "That code isn't right. Check it and try again." : failureText(cause, "We couldn't check your code. Try again."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior='padding'>
            <Screen>
                <BrandLogo />
                {codeSent ? (
                    <>
                        <T variant='display'>{newRider ? "What's your name?" : 'Enter your code'}</T>
                        {newRider ? (
                            <Field testID='rider-name' label='Your name' value={name} onChangeText={setName} textContentType='name' autoCorrect={false} autoFocus />
                        ) : (
                            <>
                                <T tone='$sub'>Sent to {phone}</T>
                                <Field testID='code-input' label='Verification code' value={code} onChangeText={setCode} keyboardType='number-pad' placeholder='6 digits' textContentType='oneTimeCode' autoFocus />
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <T variant='display'>Get a ride in minutes</T>
                        <T tone='$sub'>Enter your phone number and we'll text you a code.</T>
                        <Field testID='phone-number' label='Phone number' value={phone} onChangeText={setPhone} keyboardType='phone-pad' placeholder='+1 555 0142' textContentType='telephoneNumber' />
                    </>
                )}
                {error ? <Banner text={error} tone='danger' /> : null}
                <YStack flex={1} />
                {codeSent ? <Button testID='verify-code-submit' label={newRider ? 'Continue' : 'Verify'} onPress={verify} loading={busy} disabled={code.length < 4 || (newRider && !name.trim())} /> : <Button testID='sign-in-send-code' label='Continue' onPress={sendCode} loading={busy} disabled={phone.length < 5} />}
            </Screen>
        </KeyboardAvoidingView>
    );
}
