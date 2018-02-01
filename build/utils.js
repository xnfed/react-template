/**
 * Created by xugaobo on 2018/1/30.
 */
'use strict'
const path = require('path')
const notifier = require('node-notifier')
const packageConfig = require('../package.json')
const config = require('../config')

function resolve (dir) {
    return path.join(__dirname, '..', dir)
  }

module.exports.assetsPath = function (_path) {
  return path.posix.join(config.assetsSubDirectory, _path)
}

module.exports.createNotifierCallback = () => {

  return (severity, errors) => {
    if (severity !== 'error') return

    const error = errors[0]
    const filename = error.file && error.file.split('!').pop()

    notifier.notify({
      title: packageConfig.name,
      message: severity + ': ' + error.name,
      subtitle: filename || '',
      icon: path.join(__dirname, 'logo.png')
    })
  }
}
