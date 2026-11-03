import React from 'react';
import { ActivityIndicator, Pressable, TextInput, type TextInputProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Text, useTheme, XStack, YStack, type TextProps, type YStackProps } from 'tamagui';

export const icons = {
    back: 'M15 5l-7 7 7 7',
    user: 'M8 8a4 4 0 1 0 8 0a4 4 0 1 0-8 0z M4 21c0-4 4-6 8-6s8 2 8 6',
    home: 'M4 11l8-7 8 7v9H4z',
    work: 'M3 8h18v12H3z M9 8V5h6v3',
    clock: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0z M12 7v5l3 2',
    pin: 'M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z',
    cash: 'M3 6h18v12H3z M9.5 12a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0z',
    card: 'M3 6h18v12H3z M3 10h18',
    car: 'M5 17H3v-4l3-1 2-4.5h7.5L19 12l2 1v4h-2 M9 17h6 M6 12h13 M5 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M15 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
    van: 'M5 17H2V7a1 1 0 0 1 1-1h12l5 5 2 1v5h-3 M9 17h6 M2 11h18 M14 6v5 M5 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M15 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
    search: 'M4 11a7 7 0 1 0 14 0a7 7 0 1 0-14 0z M21 21l-4.5-4.5',
    star: 'M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.3L12 17.5l-5.6 2.9 1.1-6.3L3 9.7l6.2-.9z',
};

export function Icon({ name, size = 22, color, fill = 'none' }: { name: keyof typeof icons; size?: number; color: string; fill?: string }) {
    return (
        <Svg width={size} height={size} viewBox='0 0 24 24' fill={fill} stroke={color} strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
            <Path d={icons[name]} />
        </Svg>
    );
}

const scale = {
    display: { fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -0.5 },
    title: { fontSize: 26, lineHeight: 32, fontWeight: '800', letterSpacing: -0.4 },
    glance: { fontSize: 56, lineHeight: 60, fontWeight: '800', letterSpacing: -1 },
    action: { fontSize: 19, lineHeight: 26, fontWeight: '700' },
    strong: { fontSize: 17, lineHeight: 24, fontWeight: '600' },
    body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
    secondary: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
    caption: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
} as const;

export function T({ variant = 'body', tone = '$text', ...props }: TextProps & { variant?: keyof typeof scale; tone?: TextProps['color'] }) {
    return <Text fontFamily='$body' color={tone} {...scale[variant]} {...props} />;
}

type ButtonProps = { label: string; onPress?: () => void; kind?: 'primary' | 'second' | 'ghost' | 'danger'; disabled?: boolean; loading?: boolean; flex?: number };

export function Button({ label, onPress, kind = 'primary', disabled, loading, flex }: ButtonProps) {
    const theme = useTheme();
    const colors = {
        primary: { background: theme.accent.val, text: theme.on.val, height: 60, variant: 'action' as const },
        second: { background: theme.raised.val, text: theme.text.val, height: 56, variant: 'strong' as const },
        ghost: { background: 'transparent', text: theme.sub.val, height: 48, variant: 'strong' as const },
        danger: { background: theme.dangerBg.val, text: theme.danger.val, height: 56, variant: 'strong' as const },
    }[kind];
    const off = disabled || loading;
    return (
        <Pressable
            accessibilityRole='button'
            accessibilityState={{ disabled: !!off }}
            disabled={off}
            onPress={onPress}
            style={({ pressed }) => ({
                flex,
                height: colors.height,
                borderRadius: colors.height / 2,
                backgroundColor: off ? theme.raised.val : colors.background,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
            })}
        >
            {loading ? <ActivityIndicator color={theme.sub.val} /> : <T variant={colors.variant} tone={off ? '$sub' : colors.text}>{label}</T>}
        </Pressable>
    );
}

export function RoundButton({ icon, label, onPress }: { icon: keyof typeof icons; label: string; onPress?: () => void }) {
    const theme = useTheme();
    return (
        <Pressable accessibilityRole='button' accessibilityLabel={label} onPress={onPress} hitSlop={4}>
            <YStack width={48} height={48} borderRadius={24} backgroundColor='$surface' alignItems='center' justifyContent='center' {...floating}>
                <Icon name={icon} color={theme.text.val} />
            </YStack>
        </Pressable>
    );
}

export const floating = { shadowColor: '#111827', shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 };

export function Card(props: YStackProps) {
    return <YStack backgroundColor='$surface' borderRadius={28} padding={20} gap={14} {...floating} {...props} />;
}

/** Holds floating cards against the bottom of a map screen, above the home indicator. */
export function BottomStack(props: YStackProps) {
    const { bottom } = useSafeAreaInsets();
    return <YStack position='absolute' left={12} right={12} bottom={Math.max(bottom, 12) + 8} gap={10} {...props} />;
}

export function TopStack(props: YStackProps) {
    const { top } = useSafeAreaInsets();
    return <YStack position='absolute' left={16} right={16} top={top + 8} gap={10} {...props} />;
}

export function Screen(props: YStackProps) {
    const { top, bottom } = useSafeAreaInsets();
    return <YStack flex={1} backgroundColor='$surface' paddingTop={top + 16} paddingBottom={Math.max(bottom, 16) + 8} paddingHorizontal={20} gap={14} {...props} />;
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
    const theme = useTheme();
    return (
        <YStack gap={6}>
            <T variant='caption' tone='$sub'>{label}</T>
            <TextInput
                accessibilityLabel={label}
                placeholderTextColor={theme.sub.val}
                style={{ height: 56, borderRadius: 18, backgroundColor: theme.raised.val, color: theme.text.val, paddingHorizontal: 16, fontFamily: 'Figtree-SemiBold', fontSize: 17 }}
                {...props}
            />
        </YStack>
    );
}

export function Row({ title, subtitle, icon, trailing, onPress, last }: { title: string; subtitle?: string; icon?: keyof typeof icons; trailing?: string; onPress?: () => void; last?: boolean }) {
    const theme = useTheme();
    return (
        <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress}>
            <XStack minHeight={60} alignItems='center' gap={12} paddingVertical={6} borderBottomWidth={last ? 0 : 1} borderBottomColor='$line'>
                {icon ? (
                    <YStack width={40} height={40} borderRadius={20} backgroundColor='$tint' alignItems='center' justifyContent='center'>
                        <Icon name={icon} size={20} color={theme.ink.val} />
                    </YStack>
                ) : null}
                <YStack flex={1}>
                    <T variant='strong'>{title}</T>
                    {subtitle ? <T variant='secondary' tone='$sub'>{subtitle}</T> : null}
                </YStack>
                {trailing ? <T variant='secondary' tone='$sub'>{trailing}</T> : null}
            </XStack>
        </Pressable>
    );
}

export function Banner({ text, tone = 'warn' }: { text: string; tone?: 'warn' | 'danger' | 'ok' }) {
    const colors = { warn: ['$warnBg', '$warnFg'], danger: ['$dangerBg', '$danger'], ok: ['$okBg', '$okFg'] }[tone];
    return (
        <YStack backgroundColor={colors[0] as YStackProps['backgroundColor']} borderRadius={18} paddingHorizontal={14} paddingVertical={12}>
            <T variant='secondary' tone={colors[1] as TextProps['color']} fontWeight='600'>{text}</T>
        </YStack>
    );
}

export function Plate({ label, plate, detail, size = 44 }: { label: string; plate: string; detail?: string; size?: number }) {
    return (
        <YStack borderRadius={16} backgroundColor='$raised' padding={12} alignItems='center'>
            <T variant='caption' tone='$sub'>{label}</T>
            <T fontSize={size} lineHeight={size + 8} fontWeight='800' letterSpacing={1} style={{ fontVariant: ['tabular-nums'] }}>{plate}</T>
            {detail ? <T variant='secondary' fontWeight='600'>{detail}</T> : null}
        </YStack>
    );
}

export function Avatar({ initials, size = 60 }: { initials: string; size?: number }) {
    return (
        <YStack accessibilityLabel='Driver photo' width={size} height={size} borderRadius={size / 2} backgroundColor='$tint' alignItems='center' justifyContent='center'>
            <T fontSize={size / 3} lineHeight={size / 2} fontWeight='700' tone='$ink'>{initials}</T>
        </YStack>
    );
}
