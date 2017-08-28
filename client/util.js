const fs = require('fs')
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

const read_file = function (file_path) {
  return new Promise(function (resolve, reject) {
    fs.readFile(file_path, 'utf8', function (err, data) {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

const write_file = function (file_path, file_str) {
  return new Promise(function (resolve, reject) {
    fs.writeFile(file_path, file_str, function (err) {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

var exports = {}

exports.updated_react_templatify = updated_react_templatify
exports.read_file = read_file
exports.write_file = write_file

module.exports = exports
