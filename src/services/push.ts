import { PermissionsAndroid, Platform } from 'react-native';
import { Notifications } from 'react-native-notifications';
import { env } from '../generated/env';
import type { PushDevice } from './types';

/** What a push carries for the app: Fleet-Ops sends the order's `id` and the event `type`. */
export type PushData = { id?: string; type?: string; [key: string]: unknown };

type Handlers = {
    /** The device's push token, each time the system gives one. */
    onToken: (device: PushDevice) => void;
    /** The rider tapped a push. */
    onOpen: (data: PushData) => void;
    /** A push arrived while the app was open. It is still shown. */
    onReceive?: (data: PushData) => void;
};

/** Debug builds get sandbox APNs tokens; TestFlight and App Store builds get production ones. */
export const apnsEnvironment = (): 'production' | 'sandbox' => (__DEV__ ? 'sandbox' : 'production');

/** Android 13 and later ask before showing notifications; earlier versions and iOS ask through registration. */
async function allowed(): Promise<boolean> {
    if (Platform.OS !== 'android') {
        return true;
    }
    // Without google-services.json there's no Firebase project to get a token from.
    if (!env.androidPush) {
        return false;
    }
    if (Number(Platform.Version) < 33) {
        return true;
    }
    return (await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)) === PermissionsAndroid.RESULTS.GRANTED;
}

const dataOf = (notification: { payload?: Record<string, unknown> }): PushData => (notification?.payload ?? {}) as PushData;

/**
 * Asks to show notifications and registers for pushes. Returns a function that stops
 * listening. Errors are swallowed: an app without push still works.
 */
export function startPush({ onToken, onOpen, onReceive }: Handlers): () => void {
    const subscriptions: { remove: () => void }[] = [];
    let stopped = false;

    const events = Notifications.events();
    subscriptions.push(
        events.registerRemoteNotificationsRegistered((event) => {
            const platform = Platform.OS === 'ios' ? 'ios' : 'android';
            onToken(
                platform === 'ios'
                    ? { token: event.deviceToken, platform, environment: apnsEnvironment() }
                    : { token: event.deviceToken, platform }
            );
        }),
        events.registerRemoteNotificationsRegistrationFailed(() => {}),
        events.registerNotificationReceivedForeground((notification, completion) => {
            onReceive?.(dataOf(notification));
            // iOS shows it through completion(). Android hands a push that arrives while the
            // app is open only to JS, so it is posted to the tray here.
            if (Platform.OS === 'android') {
                try {
                    Notifications.postLocalNotification(notification.payload);
                } catch {
                    // Shown or not, the ride screen updates on its own.
                }
            }
            completion({ alert: true, sound: true, badge: false });
        }),
        events.registerNotificationOpened((notification, completion) => {
            onOpen(dataOf(notification));
            completion();
        })
    );

    // The push that launched the app from closed.
    Notifications.getInitialNotification()
        .then((notification) => notification && !stopped && onOpen(dataOf(notification)))
        .catch(() => {});

    allowed()
        .then((granted) => granted && !stopped && Notifications.registerRemoteNotifications())
        .catch(() => {});

    return () => {
        stopped = true;
        subscriptions.forEach((subscription) => subscription.remove());
    };
}
