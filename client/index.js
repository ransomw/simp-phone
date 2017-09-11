var path = require('path')
var fs = require('fs')

const {
  build_js_file: build_js_file,
  build_style: build_style,
} = require('./build')

const build_js = function (dir_out, opt_args) {
  const filenames_src = [
    'index.js'
  ]
  return Promise.all(
    filenames_src.map(function (filename_src) {
      var out_file_name = filename_src
      // clean before build
      if (fs.existsSync(out_file_name)) {
        fs.unlinkSync(out_file_name)
      }
      return build_js_file(
        path.join(__dirname, 'app', filename_src),
        path.join(dir_out, out_file_name),
        opt_args
      )
    })
  )
}

const build_styles = function (dir_out, opt_args) {
  const filenames_src = [
    'index.less'
  ]
  return Promise.all(
    filenames_src.map(function (filename_src) {
      var path_out_file = filename_src.replace(/less$/, 'css')
      return build_style(
        path.join(__dirname, 'style', filename_src),
        path.join(dir_out, path_out_file),
        opt_args
      )
    })
  )
}

var exports = {}

exports.build_js = build_js
exports.build_styles = build_styles

module.exports = exports
