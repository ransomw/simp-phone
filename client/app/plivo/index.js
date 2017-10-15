const sip_wrap = require('./sip_wrap')
const CallListener = sip_wrap.CallListener
const AUTHENTICATION_ERROR = require(
  'jssip').C.causes.AUTHENTICATION_ERROR

const err_codes = require('./const').err_codes

const check_sip_creds = function (user, pass) {
  return Promise.resolve().then(function () {
    return sip_wrap.login(user, pass)
  }).then((res) => {
    res.close()
    return {login_ok: true}
  }, (err) => {
    if (err === AUTHENTICATION_ERROR) {
      return {login_ok: false,
              err_code: err_codes.get('auth')}
    }
    if (err.name === 'timeout') {
      return {login_ok: false,
              err_code: err_codes.get('timeout')}
    }
    throw new Error("unexpected error out of plivo sip login" +
                    "'" + err + "'")
  })
}

const call_tel_num = function (creds, tel_num) {
  let close
  return Promise.resolve().then(function () {
    return sip_wrap.login(creds.user, creds.pass)
  }).then((res) => {
    close = res.close
    return sip_wrap.call_tel_num(res, tel_num)
  }).catch((err) => {
    if (close) {
      close()
    }
    throw err
  })
}

const listen_for_calls = function (creds) {
  return Promise.resolve().then(function () {
    return sip_wrap.login(creds.user, creds.pass)
  }).then((res) => {
    return new CallListener(res)
  })
}

var exports = {}

exports.check_sip_creds = check_sip_creds
exports.call_tel_num = call_tel_num
exports.listen_for_calls = listen_for_calls

module.exports = exports
