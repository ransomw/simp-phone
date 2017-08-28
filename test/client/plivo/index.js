const R = require('ramda')
const proxyquire = require('proxyquire')
const NodeWebSocketInterface = require('jssip-node-websocket')

const {
  path_app_src: path_app_src,
  delay: delay,
} = require('../util')

proxyquire(
  'jssip',
  {
    './WebSocketInterface': NodeWebSocketInterface,
  }
)

const {
  check_sip_creds: check_sip_creds,
} = require(path_app_src + '/plivo')

const creds = require('./creds.json')

const test_check_sip_creds = function (t) {
  return Promise.all([
    check_sip_creds(creds.user, creds.pass),
    check_sip_creds(creds.user, creds.pass.slice(0, -1)),
  ]).then(R.curry(R.apply)(function (
    correct_creds_res,
    bad_pass_res) {
    t.ok(correct_creds_res, "got truthy result on correct creds")
    t.notOk(bad_pass_res, "got falsy result on bad pass")
  }))
}

const tests_main = function (t) {
  t.test("check sip creds", test_check_sip_creds)
  t.test("sip wrap", require('./sip_wrap'))
  t.end()
}

var exports = tests_main

module.exports = exports
