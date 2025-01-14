// This file is the base configuration for the [webpack module bundler](https://webpack.github.io/).
// Use this file to edit settings that are the same for all environments (dev, test, prod).
const fs = require('fs')
const path = require('path')
const {UnusedFilesWebpackPlugin} = require('unused-files-webpack-plugin')
const entrypoints = require('./entrypoints')
const imageMinJpg = require('imagemin-mozjpeg')
const imageMinPng = require('imagemin-optipng')
const imageMinSvg = require('imagemin-svgo')
// Allow node to require json5 files.
require('json5/lib/register')

const srcPath = path.join(__dirname, '../src')
const sslPath = '/etc/ssl/webpack-dev'
const isTunnelTest = !!process.env.TUNNEL_TESTING

const mainSrcFolders = [
  'analytics',
  'components',
  'hooks',
  'images',
  'store',
  'styles',
  'translations',
]
module.exports = {
  devServer: {
    contentBase: './',
    disableHostCheck: isTunnelTest,
    historyApiFallback: {
      rewrites: Object.values(entrypoints).filter(({rewrite}) => rewrite).
        map(({rewrite, htmlFilename}) => ({from: rewrite, to: `/${htmlFilename}`})),
    },
    hot: true,
    https: !isTunnelTest && fs.existsSync(path.join(sslPath, 'key.pem')) ? {
      ca: fs.readFileSync(path.join(sslPath, 'chain.pem')),
      cert: fs.readFileSync(path.join(sslPath, 'cert.pem')),
      key: fs.readFileSync(path.join(sslPath, 'key.pem')),
    } : false,
    noInfo: false,
    port: 80,
    public: 'localhost.cas-contact-dev.bayes.org:9394',
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(eot|ttf|woff2?)(\?[\d&.=a-z]+)?$/,
        use: {
          loader: 'url-loader',
          options: {limit: 8192},
        },
      },
      {
        resourceQuery: /multi/,
        test: /\.(jpe?g|png)$/,
        use: [
          {
            loader: 'responsive-loader',
          },
        ],
      },
      {
        test: /\.svg(\?fill=.*)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              // Keep it as CommonJS so that we can use it to render as require in
              // HtmlWebpackPlugin template.
              esModule: false,
              limit: 8192,
            },
          },
          'svg-transform-loader',
          {
            loader: 'img-loader',
            options: {
              enabled: process.env.REACT_WEBPACK_ENV === 'dist',
              plugins: [
                imageMinPng({}),
                imageMinJpg({}),
                imageMinSvg({
                  removeComments: true,
                  removeDesc: true,
                  removeTitle: true,
                }),
              ],
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|gif)(\?[\d&.=a-z]+)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {limit: 8192},
          },
          {
            loader: 'img-loader',
            options: {
              enabled: process.env.REACT_WEBPACK_ENV === 'dist',
            },
          },
        ],
      },
      {
        test: /\.txt$/,
        use: 'raw-loader',
      },
      {
        loader: 'json5-loader',
        options: {
          esModule: false,
        },
        test: /\.json$/,
        type: 'javascript/auto',
      },
    ],
  },
  plugins: [
    new UnusedFilesWebpackPlugin({patterns: [
      'src/**/*.*',
      '!**/README.md',
      '!src/config/*.*',
      '!**/*.d.ts',
    ]}),
  ],
  resolve: {
    alias: Object.fromEntries(mainSrcFolders.map(name => [name, path.join(srcPath, name)])),
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
}
