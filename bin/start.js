/**
 * Created by xugaobo on 2018/1/30.
 */
const webpack = require('webpack')
const merge = require('webpack-merge')
const path = require('path')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const baseConfig = require('../build/webpack.config')
const config = require('../config')
const utils = require('../build/utils')
const portfinder = require('portfinder')

const HOST = process.env.HOST
const PORT = process.env.PORT && Number(process.env.PORT)

const hotWebpackConfig = merge(baseConfig, {
  devtool: 'cheap-module-eval-source-map',
  devServer: {
    inline: true,
    clientLogLevel: 'warning',
    contentBase: false, // since we use CopyWebpackPlugin.
    compress: true,
    host: HOST || config.server_host,
    port: PORT || config.server_port,
    open: config.autoOpenBrowser,
    overlay: config.errorOverlay ? { warnings: false, errors: true } : false,
    publicPath: config.compiler_public_path,
    proxy: config.proxyTable,
    quiet: true, // necessary for FriendlyErrorsPlugin
    watchOptions: {
      poll: config.poll
    }
  },
  node: {
    setImmediate: false,
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty'
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': config.globals.__DEV__
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(), // HMR shows correct file names in console on update.
    new webpack.NoEmitOnErrorsPlugin()
    // copy custom static assets
    // new CopyWebpackPlugin([
    //   {
    //     from: path.resolve(__dirname, '../static'),
    //     to: config.assetsSubDirectory,
    //     ignore: ['.*']
    //   }
    // ])
  ]
})

module.exports = new Promise((resolve, reject) => {
  portfinder.basePort = process.env.PORT || config.server_port
  portfinder.getPort((err, port) => {
    if (err) {
      reject(err)
    } else {
      // publish the new Port, necessary for e2e tests
      process.env.PORT = port
      // add port to devServer config
      hotWebpackConfig.devServer.port = port

      // Add FriendlyErrorsPlugin
      hotWebpackConfig.plugins.push(new FriendlyErrorsPlugin({
        compilationSuccessInfo: {
          messages: [`Your application is running here: http://${hotWebpackConfig.devServer.host}:${port}`]
        },
        onErrors: config.notifyOnErrors
          ? utils.createNotifierCallback()
          : undefined
      }))
      resolve(hotWebpackConfig)
    }
  })
})
