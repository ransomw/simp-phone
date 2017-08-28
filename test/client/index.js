const tape = require('blue-tape')
const tap_spec = require('tap-spec')

const {
  install_require_rt: install_require_rt,
} = require('./util')

const make_all_tests = function () {
  return function (t) {
    t.test("plivo", require('./plivo'))
    t.test("components", require('./comp'))
    t.end()
  }
}

const run_tests = function () {
  install_require_rt()
  return new Promise(function (resolve, reject) {
    tape.createStream()
            .pipe(tap_spec())
            .pipe(process.stdout)
    tape.test("all tests for this run", make_all_tests())
    tape.onFinish(function () {
      resolve()
    })
  })
}

var exports = {}

exports.run_tests = run_tests

module.exports = exports
