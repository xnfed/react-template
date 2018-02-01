const path = require('path');
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const config = require('../config')
const utils = require('./utils')
const debug = require('debug')('app:webpack:config')

const paths = config.utils_paths
const __DEV__ = config.globals.__DEV__
const __PROD__ = config.globals.__PROD__
const __TEST__ = config.globals.__TEST__

debug('Creating configuration.')
const webpackConfig = {
  context: path.resolve(__dirname, '../'),
  devtool: __DEV__ ? config.compiler_devtool : false,
  resolve: {
    alias: {
        shop: paths.client('components')
    },
    extensions: ['*', '.js', '.jsx', '.less', '.css']
    },
    module: {}
}

// Entry Points
const APP_ENTRY = paths.client('index.js')

webpackConfig.entry = {
  app: APP_ENTRY,
  vendor: config.compiler_vendors
}

// Bundle Output
webpackConfig.output = {
  filename: `[name].[hash].js`,
  chunkFilename: '[chunkhash].js',
  path: paths.dist(),
  publicPath: config.compiler_public_path
}

// Plugins
webpackConfig.plugins = [
  new webpack.DefinePlugin(config.globals),
  new HtmlWebpackPlugin({
    template: paths.base('index.html'),
    hash: false,
    favicon: paths.client('static/favicon.ico'),
    filename: 'index.html',
    minify: {
      collapseWhitespace: true
    }
  })
]

if (__DEV__) {
  debug('Enable plugins for live development (HMR, NoErrors).')
  webpackConfig.plugins.push(
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  )
} else if (__PROD__) {
  debug('Enable plugins for production (OccurenceOrder, Dedupe & UglifyJS).')
  webpackConfig.plugins.push(
    new webpack.optimize.OccurrenceOrderPlugin(),
    new UglifyJsPlugin()
  )
}

// Don't split bundles during testing, since we only want import one bundle
if (!__TEST__) {
  webpackConfig.plugins.push(
    new webpack.optimize.CommonsChunkPlugin({
      names: ['vendor']
    })
  )
}

// Eslint
webpackConfig.module.rules = [{
  test: /\.js$/,
  loader: 'eslint-loader',
  enforce: 'pre',
  exclude: /node_modules/,
  include: /src/
}]

// ------------------------------------
// Loaders
// ------------------------------------
webpackConfig.module.rules.push({
  test: /\.js$/,
  loader: 'babel-loader',
  exclude: /node_modules/
})

// Style Loaders
const BASE_CSS_LOADER = 'css-loader?sourceMap&-minimize'

webpackConfig.module.rules.push({
    test: /\.less$/,
    loader: [
      BASE_CSS_LOADER,
      'less-loader?{"sourceMap":true}'
    ]
  })

webpackConfig.module.rules.push({
  test: /\.css$/,
  loader: [
    BASE_CSS_LOADER,
    'postcss-loader'
  ]
})

// File loaders
webpackConfig.module.rules.push(
  {
    test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
    loader: 'url-loader',
    options: {
      limit: 10000,
      name: utils.assetsPath('img/[name].[hash:7].[ext]')
    }
  },
  {
    test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
    loader: 'url-loader',
    options: {
      limit: 10000,
      name: utils.assetsPath('media/[name].[hash:7].[ext]')
    }
  },
  {
    test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
    loader: 'url-loader',
    options: {
      limit: 10000,
      name: utils.assetsPath('fonts/[name].[hash:7].[ext]')
    }
  }
)

// ------------------------------------
// Finalize Configuration
// ------------------------------------
// when we don't know the public path (we know it only when HMR is enabled [in development]) we
// need to use the extractTextPlugin to fix this issue:
// http://stackoverflow.com/questions/34133808/webpack-ots-parsing-error-loading-fonts/34133809#34133809
debug('Apply ExtractTextPlugin to CSS loaders.')
webpackConfig.module.rules.filter((loader) =>
loader.loader && loader.loader instanceof Array && loader.loader.find((name) => /css/.test(name.split('?')[0]))
).forEach((loader) => {
// const first = loader.loader[0]
// const rest = loader.loader.slice(1)
loader.loader = ExtractTextPlugin.extract(loader.loader)
})

webpackConfig.plugins.push(
new ExtractTextPlugin({
    filename: '[name].[contenthash].css',
    allChunks: true
})
)

module.exports = webpackConfig
