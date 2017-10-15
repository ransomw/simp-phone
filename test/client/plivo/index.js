const R = require('ramda')

const {
  path_app_src: path_app_src,
  delay: delay,
} = require('../util')

const {
  make_wd_test: make_wd_test
} = require('../wd_serve')

const {
  check_sip_creds: check_sip_creds,
  call_tel_num: call_tel_num,
} = require(path_app_src + '/plivo')
const {
  err_codes: plivo_err_codes,
} = require(path_app_src + '/plivo/const')

const creds = require('./creds.json')
const {
  tel_num: tel_num,
  // ms.  default: 30000
  WD_SCRIPT_TIMEOUT: WD_SCRIPT_TIMEOUT,
} = require('./fixture.json')

const test_check_sip_creds = function (t) {
  return Promise.all([
    check_sip_creds(creds.user, creds.pass),
    check_sip_creds(creds.user, creds.pass.slice(0, -1)),
  ]).then(R.curry(R.apply)(function (
    correct_creds_res,
    bad_pass_res) {
    t.ok(correct_creds_res.login_ok,
         "got truthy result on correct creds")
    t.notOk(bad_pass_res.login_ok,
            "got falsy result on bad pass")
    t.equal(bad_pass_res.err_code,
            plivo_err_codes.get('auth'),
            "got expected error code on bad pass")
  }))
}

const wd_test_call_tel_num = make_wd_test(
  require.resolve(path_app_src + '/plivo'),
  (t, wd_client) => {
    return Promise.resolve().then(function () {
      return wd_client.timeouts('script', WD_SCRIPT_TIMEOUT)
    }).then(function () {
      return wd_client.executeAsync(function (creds, tel_num, done) {
        /* jshint browser: true */
        /* globals Test, MediaStream, MediaStreamTrack */
        Promise.resolve().then(function () {
          return Test.call_tel_num(creds, tel_num)
        }).then(function (res) {
          if (res.mediaStream instanceof MediaStream &&
              res.mediaStreamTrack instanceof MediaStreamTrack) {
            done(['ok', null])
          } else {
            done([null, "missing media stream or media stream track"])
          }
        }, function (err) {
          done([null, err])
        })
      }, creds, tel_num)
    }).then(R.compose(R.curry(R.apply)(function (res, err) {
      t.ok(res, "non-error result out of wd script")
      t.notOk(err, "no error out of wd script")
    }), R.prop('value')))
  })

const tests_main = function (t) {
  t.test("check sip creds", test_check_sip_creds)
  t.test("call telephone number", wd_test_call_tel_num)
  t.end()
}

var exports = tests_main

module.exports = exports
