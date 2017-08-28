const fs = require('fs')
const path = require('path')

const R = require('ramda')
const react_templates = require('react-templates')

const path_app_src = path.join(
  __dirname, '..', '..',
  'client', 'app')

const delay = function (ms_dur) {
  return function () {
    return new Promise(function (resolve, reject) {
      setTimeout(resolve, ms_dur)
    })
  }
}

// module-private
var require_rt_installed = false

/** allow require()ing .rt react template files */
const install_require_rt = function () {
  if (require_rt_installed) {
    return
  }
  require.extensions['.rt'] = function (module, filename) {
    var source = fs.readFileSync(filename, {encoding: 'utf8'})
    var code = react_templates.convertTemplateToReact(
            source, {
              modules: 'commonjs',
                // react minor version mismatch intended
              targetVersion: '0.14.0'
            }
        )
    module._compile(code, filename)
  }
  require_rt_installed = true
}

const clear_require_cache = function () {
  R.forEach(function (moduleName) {
    if (moduleName.indexOf('client/app') !== -1) {
      delete require.cache[moduleName]
    }
  }, R.keys(require.cache))
}

var exports = {}

exports.path_app_src = path_app_src
exports.delay = delay
exports.install_require_rt = install_require_rt
exports.clear_require_cache = clear_require_cache

module.exports = exports
