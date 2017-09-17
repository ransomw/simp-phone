const R = require('ramda')
const jssipC = require('jssip').C

const {
  path_app_src: path_app_src,
  delay: delay,
} = require('../util')

const {
  make_wd_test: make_wd_test
} = require('../wd_serve')

const Plivo = require(path_app_src + '/plivo/sip_wrap').Plivo

const creds = require('./creds.json')
const {
  tel_num: tel_num,
  // ms.  default: 30000
  WD_SCRIPT_TIMEOUT: WD_SCRIPT_TIMEOUT,
} = require('./fixture.json')

const test_connect = function (t) {
  const plivo = new Plivo()
  t.ok(plivo, "created plivo object")
  return Promise.resolve().then(function () {
    return Promise.all(R.flatten([
      R.map((ev_name) => new Promise(function (resolve, reject) {
        plivo.on(ev_name, (res) => resolve(res))
      }), [
        'ua:connecting',
        'ua:connected',
      ]),
      plivo.login(creds.user, creds.pass),
    ]))
  }).then(R.curry(R.apply)(function (
    res_connecting,
    res_connected,
    res_login,
  ) {
    t.pass("connecting and connected events emitted, login resolved")
    t.equal(typeof res_connecting.attempts, 'number',
            "connecting event result contains a number of attempts")
    t.notOk(res_connecting.socket,
            "no socket attr on the connecting result")
    return plivo.close()
  }))
}

const test_login_fail = function (t) {
  const plivo = new Plivo()
  t.ok(plivo, "created plivo object")
  return Promise.resolve().then(function () {
    return plivo.login(creds.user, creds.pass.slice(0, -1))
  }).then(function () {
    t.fail("login resolved with bad pass")
    return plivo.close()
  }, function (err) {
    t.pass("login promise rejected with bad pass")
    t.ok(err, "got non-nil error object")
    t.equals(jssipC.causes.AUTHENTICATION_ERROR, err,
             "got expected error")
    t.equals(jssipC.causes.AUTHENTICATION_ERROR, 'Authentication Error',
             "... and check library documentation only")
    return plivo.close()
  })
}

const test_phone_number_format = function (t) {
  const plivo = new Plivo()
  t.ok(plivo, "created plivo object")
  return Promise.resolve().then(function () {
    return plivo.login(creds.user, creds.pass)
  }).then(function () {
    t.pass("login resolved")
    return plivo.call_tel_num('180055a1234')
  }).then(function () {
    return plivo.close()
    t.end("managed to call non-numeric phone number")
  }, function (err) {
    t.pass("call_tel_num rejected with non-numeric phone number")
    t.ok(err instanceof Error, "and got an error object")
    t.equal(err.name, 'InvalidNumber',
            "it's an 'InvalidNumber' error")
  }).then(function () {
    return plivo.call_tel_num('123456')
  }).then(function () {
    return plivo.close()
    t.end("managed to call a phone number without enough digits")
  }, function (err) {
    t.pass("rejected a phone number without enough digits")
    t.ok(err instanceof Error, "and got an error object")
    t.equal(err.name, 'InvalidNumber',
            "it's an 'InvalidNumber' error")
  }).then(function () {
    return plivo.close()
  })
}

const wd_test_call_tel_num = make_wd_test(
  require.resolve(path_app_src + '/plivo/sip_wrap'),
  (t, wd_client) => {
    return Promise.resolve().then(function () {
      return wd_client.timeouts('script', WD_SCRIPT_TIMEOUT)
    }).then(function () {
      return wd_client.executeAsync(function (creds, tel_num, done) {
        const plivo = new Test.Plivo()
        return Promise.resolve().then(function () {
          return plivo.login(creds.user, creds.pass)
        }).then(function () {
          return plivo.call_tel_num(tel_num)
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
  t.test("connect", test_connect)
  t.test("login fail", test_login_fail)
  t.test("phone number format", test_phone_number_format)
  t.test("call telephone number", wd_test_call_tel_num)
  t.end()
}

var exports = tests_main

module.exports = exports
