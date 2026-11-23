const fs = require('fs');
const path = require('path');

// brand/fonts: a client build's own font files, named by PostScript name.
const brandFonts = path.join(__dirname, 'brand', 'fonts');

module.exports = {
    assets: ['./assets/fonts', ...(fs.existsSync(brandFonts) ? ['./brand/fonts'] : [])],
    dependencies: {
        // react-native-notifications autolinks as `new RNNotificationsPackage(reactNativeHost.getApplication())`.
        // MainApplication builds the React host without a ReactNativeHost (the new architecture's
        // template), so that field is null and the app crashed on launch on Android. PackageList's
        // own getApplication() falls back to the Application when there is no host.
        'react-native-notifications': {
            platforms: {
                android: {
                    packageInstance: 'new RNNotificationsPackage(getApplication())',
                },
            },
        },
    },
};
