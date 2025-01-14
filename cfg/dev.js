const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const mapKeys = require('lodash/mapKeys')
const mapValues = require('lodash/mapValues')
const WebpackPwaManifest = require('webpack-pwa-manifest')

const baseConfig = require('./base')
const entrypoints = require('./entrypoints')
const colors = require('./colors.json5')
const constants = require('./const.json5')


module.exports = {
  ...baseConfig,
  cache: true,
  devtool: 'eval-source-map',
  entry: mapValues(entrypoints, ({entry, usesHotLoader}) => ([
    ...usesHotLoader ? ['react-hot-loader/patch'] : [],
    'webpack-dev-server/client?http://0.0.0.0:0',
    ...usesHotLoader ? ['webpack/hot/only-dev-server'] : [],
    'whatwg-fetch',
    entry,
  ])),
  mode: 'development',
  module: {
    ...baseConfig.module,
    rules: [
      ...baseConfig.module.rules,
      {
        include: [
          path.join(__dirname, '/../src'),
        ],
        test: /\.[jt]sx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
              'react-hot-loader/babel',
              '@babel/plugin-syntax-dynamic-import',
              ['@babel/plugin-proposal-class-properties', {loose: false}],
              ['@babel/plugin-proposal-optional-chaining', {loose: false}],
            ],
            presets: [
              ['@babel/env', {corejs: 3, modules: false, useBuiltIns: 'usage'}],
              '@babel/react',
              '@babel/typescript',
            ],
          },
        },
      },
      {
        enforce: 'pre',
        include: [
          path.join(__dirname, '/../src'),
        ],
        test: /\.(js|jsx)$/,
        use: {
          loader: 'eslint-loader',
          options: {emitWarning: true},
        },
      },
    ],
  },
  output: {
    filename: '[name].js',
    path: __dirname,
    publicPath: baseConfig.devServer.publicPath,
  },
  plugins: [
    ...baseConfig.plugins,
    new webpack.LoaderOptionsPlugin({
      debug: true,
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
    new webpack.DefinePlugin({
      ...mapKeys(mapValues(colors, JSON.stringify), (color, name) => `colors.${name}`),
      ...mapKeys(mapValues(constants, JSON.stringify), (value, key) => `config.${key}`),
      'config.clientVersion': JSON.stringify(process.env.CLIENT_VERSION),
      'config.environment': '"dev"',
    }),
    // Embed the JavaScript in the index.html page.
    ...Object.keys(entrypoints).filter(key => entrypoints[key].htmlFilename).map(key =>
      new HtmlWebpackPlugin({
        chunks: [key],
        filename: `${entrypoints[key].htmlFilename}`,
        template: './src/index.tsx',
      }),
    ),
    ...Object.keys(entrypoints).filter(key => entrypoints[key].htmlFilename).map(key =>
      new HtmlWebpackPlugin({
        chunks: [key],
        filename: `en.${entrypoints[key].htmlFilename}`,
        template: './src/en.index.tsx',
      }),
    ),
    new WebpackPwaManifest({
      // eslint-disable-next-line camelcase
      background_color: colors.MINTY_GREEN,
      lang: 'fr-FR',
      name: constants.productName,
      // eslint-disable-next-line camelcase
      theme_color: colors.MINTY_GREEN,
    }),
    new webpack.NoEmitOnErrorsPlugin(),
  ],
  resolve: {
    ...baseConfig.resolve,
    alias: {
      ...baseConfig.resolve.alias,
      'react-dom': '@hot-loader/react-dom',
    },
  },
}
