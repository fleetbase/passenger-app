import { PermissionsAndroid, Platform } from 'react-native';
import * as notifications from 'react-native-notifications';
import { Notifications } from 'react-native-notifications';
import { env } from '../src/generated/env';
import { startPush } from '../src/services/push';

jest.mock('../src/generated/env', () => ({ env: { androidPush: true } }));

const listeners = (notifications as unknown as { __listeners: Record<string, (...args: any[]) => void> }).__listeners;
const flush = () => new Promise<void>((resolve) => setImmediate(() => resolve()));
const setPlatform = (os: string, version: number) => {
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => os });
    Object.defineProperty(Platform, 'Version', { configurable: true, get: () => version });
};

beforeEach(() => jest.clearAllMocks());

test('ios registers, reports the token with its apns environment, and shows foreground pushes', async () => {
    setPlatform('ios', 17);
    const onToken = jest.fn();
    const onReceive = jest.fn();
    const stop = startPush({ onToken, onOpen: jest.fn(), onReceive });
    await flush();

    expect(Notifications.registerRemoteNotifications).toHaveBeenCalledTimes(1);
    listeners.registered({ deviceToken: 'apns-token' });
    expect(onToken).toHaveBeenCalledWith({ token: 'apns-token', platform: 'ios', environment: 'sandbox' });

    const completion = jest.fn();
    listeners.foreground({ payload: { id: 'order_1', type: 'order_update' } }, completion);
    expect(onReceive).toHaveBeenCalledWith({ id: 'order_1', type: 'order_update' });
    expect(Notifications.postLocalNotification).not.toHaveBeenCalled();
    expect(completion).toHaveBeenCalledWith({ alert: true, sound: true, badge: false });

    stop();
    expect(listeners.registered).toBeUndefined();
});

test('android asks before showing notifications, and posts foreground pushes to the tray', async () => {
    setPlatform('android', 34);
    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValueOnce(PermissionsAndroid.RESULTS.GRANTED);
    const onToken = jest.fn();
    const onOpen = jest.fn();
    startPush({ onToken, onOpen });
    await flush();

    expect(PermissionsAndroid.request).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    expect(Notifications.registerRemoteNotifications).toHaveBeenCalledTimes(1);
    listeners.registered({ deviceToken: 'fcm-token' });
    expect(onToken).toHaveBeenCalledWith({ token: 'fcm-token', platform: 'android' });

    listeners.foreground({ payload: { title: 'Your driver has arrived' } }, jest.fn());
    expect(Notifications.postLocalNotification).toHaveBeenCalledWith({ title: 'Your driver has arrived' });

    const done = jest.fn();
    listeners.opened({ payload: { id: 'order_1' } }, done);
    expect(onOpen).toHaveBeenCalledWith({ id: 'order_1' });
    expect(done).toHaveBeenCalled();
});

test('android without permission does not register, and a push that opened the app is handed over', async () => {
    setPlatform('android', 34);
    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValueOnce(PermissionsAndroid.RESULTS.DENIED);
    (Notifications.getInitialNotification as jest.Mock).mockResolvedValueOnce({ payload: { id: 'order_2', type: 'order_completed' } });
    const onOpen = jest.fn();
    startPush({ onToken: jest.fn(), onOpen });
    await flush();

    expect(Notifications.registerRemoteNotifications).not.toHaveBeenCalled();
    expect(onOpen).toHaveBeenCalledWith({ id: 'order_2', type: 'order_completed' });
});

test('android builds without a Firebase project never register', async () => {
    setPlatform('android', 34);
    (env as { androidPush: boolean }).androidPush = false;
    const request = jest.spyOn(PermissionsAndroid, 'request');
    startPush({ onToken: jest.fn(), onOpen: jest.fn() });
    await flush();

    expect(request).not.toHaveBeenCalled();
    expect(Notifications.registerRemoteNotifications).not.toHaveBeenCalled();
    (env as { androidPush: boolean }).androidPush = true;
});

test('older android versions register without asking', async () => {
    setPlatform('android', 30);
    const request = jest.spyOn(PermissionsAndroid, 'request');
    startPush({ onToken: jest.fn(), onOpen: jest.fn() });
    await flush();

    expect(request).not.toHaveBeenCalled();
    expect(Notifications.registerRemoteNotifications).toHaveBeenCalledTimes(1);
});
