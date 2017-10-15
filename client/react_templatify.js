const react_templatify = require('react-templatify')

/**
 * prevents deprecation warning in newer versions of react
 */
const updated_react_templatify = function (file, options) {
  var opts = options || {}
    // attempting to match minor version breaks build
  opts.targetVersion = '0.14.0'
  return react_templatify(file, opts)
}

var exports = updated_react_templatify

module.exports = exports
