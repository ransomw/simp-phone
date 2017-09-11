var path = require('path')
var fs = require('fs')

const browserify = require('browserify')
const watchify = require('watchify')
const less = require('less')

const {
  read_file: read_file,
  write_file: write_file,
  updated_react_templatify: react_templatify
} = require('./util')

const do_build_step = function (fn_do_once, path_watch, cts) {
  return fn_do_once().then(function () {
    if (cts) {
      fs.watch(path_watch, {recursive: true}, function () {
        fn_do_once()
          .catch(function (err) {
            console.log("client build error")
            console.log(err)
          })
      })
    }
  })
}


const build_js_file = function (path_src, path_out, opt_args) {
  const opts = opt_args || {}
  const make_write_bundle = function (bfy, path_bundle) {
    return function () {
      return new Promise(function (resolve, reject) {
        var stream_bundle = bfy.bundle()
        stream_bundle.pipe(fs.createWriteStream(path_bundle))
        stream_bundle.on('end', function () {
          resolve()
        })
      })
    }
  }
  const arr_plugins = []
  if (opts.cts) {
    arr_plugins.push(watchify)
  }
  const arr_transforms = []
  arr_transforms.push(react_templatify)
  const bfy = browserify({
    entries: [path_src],
    cache: {},
    packageCache: {},
    debug: true, // source maps
    plugin: arr_plugins,
    transform: arr_transforms,
    standalone: opts.standalone
  })
  var write_bundle = make_write_bundle(bfy, path_out)
  if (opts.cts) {
    bfy.on('update', write_bundle)
  }
  return write_bundle()
}

const build_style = function (path_src_file, path_output, opt_args) {
  const opts = opt_args || {}
  const dir_src = path.dirname(path_src_file)
  const do_once = function () {
    return read_file(path_src_file)
      .then(function (str_less_input) {
        return less.render(str_less_input, {
          paths: [
            dir_src,
            path.join(dir_src, 'lib'),
            path.join(dir_src, 'vendor')
          ]
        })
      }).then(function (less_output) {
        var str_css = less_output.css
        // var str_sourcemap = less_output.sourcemap
        // var arr_imports = less_output.imports
        return write_file(path_output, str_css)
      })
  }
  return do_build_step(do_once, dir_src, opts.cts)
}

var exports = {}

exports.build_js_file = build_js_file
exports.build_style = build_style

module.exports = exports
