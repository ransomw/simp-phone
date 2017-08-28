const proxyquire = require('proxyquire')
const NodeWebSocketInterface = require('jssip-node-websocket')

proxyquire(
  'jssip',
  {
    './WebSocketInterface': NodeWebSocketInterface,
  }
)

const jssipC = require('jssip').C

const {
  path_app_src: path_app_src,
  delay: delay,
} = require('../util')

const Plivo = require(path_app_src + '/plivo/sip_wrap').Plivo
const creds = require('./creds.json')

const test_connect = function (t) {
  const plivo = new Plivo()
  t.ok(plivo, "created plivo object")
  return Promise.resolve().then(function () {
    return plivo.login(creds.user, creds.pass)
  }).then(function () {
    t.pass("login resolved")
    plivo.close()
  })
}

const test_login_fail = function (t) {
  const plivo = new Plivo()
  t.ok(plivo, "created plivo object")
  return Promise.resolve().then(function () {
    return plivo.login(creds.user, creds.pass.slice(0, -1))
  }).then(function () {
    t.end("login resolved with bad pass")
    plivo.close()
  }, function (err) {
    t.pass("login promise rejected with bad pass")
    plivo.close()
    t.ok(err, "got non-nil error object")
    t.equals(jssipC.causes.AUTHENTICATION_ERROR, err,
             "got expected error")
    t.equals(jssipC.causes.AUTHENTICATION_ERROR, 'Authentication Error',
             "... and check library documentation only")
  })
}

const tests_main = function (t) {
  t.test("connect", test_connect)
  t.test("login fail", test_login_fail)
  t.end()
}

var exports = tests_main

module.exports = exports
