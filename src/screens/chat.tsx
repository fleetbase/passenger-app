import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, TextInput } from 'react-native';
import { useTheme, XStack, YStack } from 'tamagui';
import { fontFace } from '../branding';
import type { RootStack } from '../navigation';
import type { ChatMessage } from '../services/types';
import { useApp } from '../state/AppContext';
import { Avatar, Banner, Icon, RoundButton, Screen, T } from '../ui';
import { formatTime } from '../utils/format';

const QUICK_REPLIES = ["I'm here", 'On my way', 'Running late'];

/** R19. */
export function ChatScreen({ navigation }: NativeStackScreenProps<RootStack, 'Chat'>) {
    const { service, ride } = useApp();
    const theme = useTheme();
    const scroller = useRef<ScrollView>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [draft, setDraft] = useState('');
    const [failed, setFailed] = useState(false);
    const rideId = ride?.id;

    useEffect(() => {
        if (rideId) {
            return service.watchMessages(rideId, setMessages);
        }
    }, [service, rideId]);

    if (!ride?.driver || !rideId) {
        return null;
    }

    const send = async (text: string) => {
        const body = text.trim();
        if (!body) {
            return;
        }
        setDraft('');
        setFailed(false);
        try {
            await service.sendMessage(rideId, body);
        } catch {
            setDraft(body);
            setFailed(true);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior='padding'>
            <Screen gap={10}>
                <XStack alignItems='center' gap={12}>
                    <RoundButton icon='back' label='Back' onPress={navigation.goBack} />
                    <Avatar initials={ride.driver.initials} size={44} />
                    <YStack flex={1}>
                        <T variant='strong' fontWeight='700'>{ride.driver.name}</T>
                        <T variant='secondary' tone='$sub' numberOfLines={1}>{ride.driver.vehicle} · {ride.driver.plate}</T>
                    </YStack>
                </XStack>
                <ScrollView
                    ref={scroller}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
                    keyboardShouldPersistTaps='handled'
                    onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
                >
                    {messages.length === 0 ? <T tone='$sub' textAlign='center'>Messages to {ride.driver.name.split(' ')[0]} show up here.</T> : null}
                    {messages.map((message) => {
                        const mine = message.from === 'rider';
                        return (
                            <YStack key={message.id} alignSelf={mine ? 'flex-end' : 'flex-start'} maxWidth='80%' gap={2}>
                                <YStack backgroundColor={mine ? '$accent' : '$raised'} borderRadius={18} paddingHorizontal={14} paddingVertical={10}>
                                    <T tone={mine ? '$on' : '$text'}>{message.text}</T>
                                </YStack>
                                <T variant='caption' tone='$sub' fontWeight='400' textAlign={mine ? 'right' : 'left'}>
                                    {mine ? `Delivered ${formatTime(message.sentAt)}` : formatTime(message.sentAt)}
                                </T>
                            </YStack>
                        );
                    })}
                </ScrollView>
                {failed ? <Banner tone='danger' text="Your message didn't send. Try again." /> : null}
                <XStack gap={8} flexWrap='wrap'>
                    {QUICK_REPLIES.map((reply) => (
                        <Pressable key={reply} accessibilityRole='button' onPress={() => send(reply)}>
                            <YStack height={44} paddingHorizontal={16} borderRadius={22} backgroundColor='$tint' justifyContent='center'>
                                <T variant='secondary' tone='$ink' fontWeight='600'>{reply}</T>
                            </YStack>
                        </Pressable>
                    ))}
                </XStack>
                <XStack gap={8} alignItems='center'>
                    <TextInput
                        accessibilityLabel='Message'
                        value={draft}
                        onChangeText={setDraft}
                        onSubmitEditing={() => send(draft)}
                        placeholder='Type a message'
                        placeholderTextColor={theme.sub.val}
                        returnKeyType='send'
                        style={{ flex: 1, height: 52, borderRadius: 26, backgroundColor: theme.raised.val, color: theme.text.val, paddingHorizontal: 18, fontFamily: fontFace('500'), fontSize: 16 }}
                    />
                    <Pressable accessibilityRole='button' accessibilityLabel='Send' disabled={!draft.trim()} onPress={() => send(draft)}>
                        <YStack width={52} height={52} borderRadius={26} backgroundColor={draft.trim() ? '$accent' : '$raised'} alignItems='center' justifyContent='center'>
                            <Icon name='send' color={draft.trim() ? theme.on.val : theme.sub.val} />
                        </YStack>
                    </Pressable>
                </XStack>
            </Screen>
        </KeyboardAvoidingView>
    );
}
