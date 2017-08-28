#! /usr/bin/env node

const path = require('path')

const build_js = require('../client').build_js
const build_styles = require('../client').build_styles

const argv = require('yargs').options({
  'p': {
    alias: 'dir_out',
    desc: ("output directory path\n" +
           "the default is set to play with run_server.py"),
    type: 'string',
    default: path.join(
      __dirname, '..',
      'server', 'simp_phone', 'flask_app',
      'views', 'frontend', 'static'
    )
  },
  'c': {
    alias: 'cts',
    desc: "continuous (rebuild on save ^C to exit)",
    type: 'boolean'
  }
}).help().argv

Promise.resolve().then(function () {
  return Promise.all([
    build_js(path.join(argv.dir_out, 'js', 'compiled'), {
      cts: argv.cts,
      prod: argv.prod
    }).catch(function (err) {
      console.error("js build failed with error")
      console.error(err)
      console.log(err.stack)
      process.exit(1)
    }),
    build_styles(path.join(argv.dir_out, 'css', 'compiled'), {
      cts: argv.cts
    }).catch(function (err) {
      console.error("custom styles build failed with error")
      console.error(err)
      console.log(err.stack)
      process.exit(1)
    })])
}).then(function () {
  console.log("js and custom styles build finished")
}, function (err) {
  console.error("js or css build failed with error")
  console.error(err)
  console.log(err.stack)
  process.exit(1)
})
