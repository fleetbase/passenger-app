const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// Point the app at brand/ on every Metro start (Babel's config runs it too, but only when
// a file is transformed, which a warm cache skips).
require('./scripts/link-brand').linkBrand(__dirname);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
