const R = require('ramda')
const jssipC = require('jssip').C

const {
  path_app_src: path_app_src,
  delay: delay,
} = require('../util')

const {
  make_wd_test: make_wd_test
} = require('../wd_serve')

const {
  login,
  call_tel_num,
} = require(path_app_src + '/plivo/sip_wrap')

const creds = require('./creds.json')
const {
  tel_num: tel_num,
  // ms.  default: 30000
  WD_SCRIPT_TIMEOUT: WD_SCRIPT_TIMEOUT,
} = require('./fixture.json')

const test_connect = function (t) {
  const login_res_fns = [
    'close',
    'on',
    'call',
  ]
  return Promise.resolve().then(() => {
    return login(creds.user, creds.pass)
  }).then((res) => {
    t.pass("connecting and connected events emitted, login resolved")
    t.deepEqual(R.keys(res), login_res_fns,
                "found expected keys on login result")
    R.forEach((key) => t.equal(typeof res[key], 'function',
                               key + " is a function"),
              login_res_fns)
    return res.close()
  }, (err) => {
    t.fail("error on plivo login")
    console.error(err)
  })
}

const test_login_fail = function (t) {
  return Promise.resolve().then(() => {
    return login(creds.user, creds.pass.slice(0, -1))
  }).then((res) => {
    t.fail("login resolved with bad pass")
    return res.close()
  }, (err) => {
    t.pass("login promise rejected with bad pass")
    t.ok(err, "got non-nil error object")
    t.equals(jssipC.causes.AUTHENTICATION_ERROR, err,
             "got expected error")
    t.equals(jssipC.causes.AUTHENTICATION_ERROR, 'Authentication Error',
             "... and check library documentation only")
  })
}

const test_phone_number_format = function (t) {
  let login_res
  return Promise.resolve().then(() => {
    return login(creds.user, creds.pass)
  }).then((res) => {
    t.pass("login resolved")
    login_res = res
    return call_tel_num(login_res, '180055a1234')
  }, (err) => {
    console.error(err)
    t.end("unexpected error on login")
  }).then(() => {
    const fail_fn = function () {
      t.end("managed to call non-numeric phone number")
    }
    return Promise.resolve().then(() => {
      return login_res.close()
    }).then(fail_fn, fail_fn)
  }, (err) => {
    t.pass("call_tel_num rejected with non-numeric phone number")
    t.ok(err instanceof Error, "and got an error object")
    t.equal(err.name, 'InvalidNumber',
            "it's an 'InvalidNumber' error")
  }).then(() => {
    return call_tel_num(login_res, '123456')
  }).then(() => {
    const fail_fn = function () {
      t.end("managed to call a phone number without enough digits")
    }
    return Promise.resolve().then(() => {
      return login_res.close()
    }).then(fail_fn, fail_fn)
  }, (err) => {
    t.pass("rejected a phone number without enough digits")
    t.ok(err instanceof Error, "and got an error object")
    t.equal(err.name, 'InvalidNumber',
            "it's an 'InvalidNumber' error")
  }).then(() => {
    return login_res.close()
  }, (err) => {
    t.fail("unexpected error")
    console.error(err)
    return login_res.close()
  })
}

const wd_test_call_tel_num = make_wd_test(
  require.resolve(path_app_src + '/plivo/sip_wrap'),
  (t, wd_client) => {
    return Promise.resolve().then(function () {
      return wd_client.timeouts('script', WD_SCRIPT_TIMEOUT)
    }).then(function () {
      return wd_client.executeAsync(function (creds, tel_num, done) {
        /* jshint browser: true */
        /* globals Test, MediaStream, MediaStreamTrack */
        const {
          login,
          call_tel_num,
        } = Test
        let login_res
        return Promise.resolve().then(() => {
          return login(creds.user, creds.pass)
        }).then((res) => {
          login_res = res
          return call_tel_num(res, tel_num)
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
