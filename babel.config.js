// Every tool that compiles the app (Metro, Jest) loads this file first, so the brand/
// lookup is refreshed before any module resolves it.
require('./scripts/link-brand').linkBrand(__dirname);

module.exports = {
    presets: ['module:@react-native/babel-preset'],
    plugins: process.env.NODE_ENV === 'test' ? ['@babel/plugin-transform-dynamic-import'] : [],
};
