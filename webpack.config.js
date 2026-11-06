const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const { host } = require('./scripts/link-brand').linkBrand(__dirname);

const appPaths = ['index.web.js', 'App.tsx', 'tamagui.config.ts', 'passenger.brand.ts', 'passenger.extensions.ts', 'brand', 'src'].map((item) => path.resolve(__dirname, item));

module.exports = (env, { mode = 'development' }) => ({
    target: 'web',
    mode,
    devtool: 'source-map',
    entry: path.resolve(__dirname, 'index.web.js'),
    output: {
        filename: 'bundle.[contenthash].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    devServer: {
        port: 8092,
        hot: true,
        // The API only accepts browser requests from its allowed origins, so development goes
        // through this server. A production site's address must be in the API's FRONTEND_HOSTS.
        proxy: host ? [{ context: ['/v1', '/ledger'], target: host, changeOrigin: true }] : [],
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                resolve: { fullySpecified: false },
            },
            {
                test: /\.(js|ts|tsx)$/,
                include: appPaths,
                use: {
                    loader: 'babel-loader',
                    options: {
                        babelrc: false,
                        configFile: false,
                        presets: [['module:@react-native/babel-preset', { disableImportExportTransform: true }]],
                    },
                },
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(ttf|otf)$/,
                type: 'asset/resource',
            },
            {
                test: /\.png$/,
                type: 'asset/resource',
            },
        ],
    },
    resolve: {
        alias: { 'react-native$': 'react-native-web' },
        extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js', '.mjs', '.json'],
        mainFields: ['browser', 'module', 'main'],
    },
    plugins: [
        new webpack.DefinePlugin({
            __DEV__: JSON.stringify(mode !== 'production'),
            'process.env.TAMAGUI_TARGET': JSON.stringify('web'),
        }),
        new HtmlWebpackPlugin({
            title: require('./app.json').displayName,
            template: path.resolve(__dirname, 'web/index.html'),
            favicon: path.resolve(__dirname, 'web/favicon.png'),
        }),
    ],
    performance: { hints: false },
});
