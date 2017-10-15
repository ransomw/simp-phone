const proxyquire = require('proxyquire').noPreserveCache()
const simple = require('simple-mock')
const R = require('ramda')

const {
  path_app_src: path_app_src,
  delay: delay,
} = require('../util')

const {
  make_wd_test: make_wd_test
} = require('../wd_serve')

const plivo_conf_login_timeout = R.merge(
    require(path_app_src + '/plivo/plivo_conf.json'), {
      "timeouts": {
        "login": 60,
        "call": 300,
      },
    })

// proxy into webdriver setup?
const plivo_conf_call_timeout = R.merge(
    require(path_app_src + '/plivo/plivo_conf.json'), {
      "timeouts": {
        "login": 1000,
        "call": 300,
      },
    })

const login = proxyquire(path_app_src + '/plivo/sip_wrap', {
  './plivo_conf.json': plivo_conf_login_timeout,
}).login

const call_tel_num = proxyquire(path_app_src + '/plivo/sip_wrap', {
  'jssip': require('./proxies').jssip__nodews,
  './plivo_conf.json': plivo_conf_call_timeout,
}).call_tel_num

const plivo_conf = require('./proxies')

const creds = require('./creds.json')
const {
  tel_num: tel_num,
  // ms.  default: 30000
  WD_SCRIPT_TIMEOUT: WD_SCRIPT_TIMEOUT,
} = require('./fixture.json')

const make_timeout_test = function (test_fn) {
  return function (t) {
    t.test("setup", function (t) {
      simple.mock(plivo_conf, 'timeouts', {
        login: 10,
        call: 300,
      })
      t.end()
    })
    t.test("run test", test_fn)
    t.test("teardown", function (t) {
      simple.restore()
      t.end()
    })
    t.end()
  }
}

const test_connect_timeout = make_timeout_test(function (t) {
  return Promise.resolve().then(function () {
    return login(creds.user, creds.pass)
  }).then(function (res) {
    t.fail("login resolved instead of timeout")
    return res.close()
  }, function (err) {
    t.pass("login promise rejected")
    t.ok(err instanceof Error,
         "rejected with an error")
    t.equal(err.name, 'timeout',
            "error identified as timeout")
  })
})

const tests_main = function (t) {
  t.test("connect timeout", test_connect_timeout)
  t.end()
}

var exports = tests_main

module.exports = exports
