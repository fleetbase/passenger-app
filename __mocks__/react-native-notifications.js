// Jest stand-in for react-native-notifications: records listeners so tests can fire events.
const listeners = {};
const on = (name) => (callback) => {
    listeners[name] = callback;
    return { remove: () => delete listeners[name] };
};

const events = {
    registerRemoteNotificationsRegistered: on('registered'),
    registerRemoteNotificationsRegistrationFailed: on('failed'),
    registerNotificationReceivedForeground: on('foreground'),
    registerNotificationOpened: on('opened'),
};

module.exports = {
    __listeners: listeners,
    Notifications: {
        events: () => events,
        registerRemoteNotifications: jest.fn(),
        postLocalNotification: jest.fn(),
        getInitialNotification: jest.fn(async () => undefined),
    },
};
