const Plivo = require('./sip_wrap').Plivo
const AUTHENTICATION_ERROR = require(
  'jssip').C.causes.AUTHENTICATION_ERROR

const check_sip_creds = function (user, pass) {
  const plivo = new Plivo()
  return Promise.resolve().then(function () {
    return plivo.login(user, pass)
  }).then(function () {
    plivo.close()
    return true
  }, function (err) {
    plivo.close()
    if (err === AUTHENTICATION_ERROR) {
      return false
    }
    throw new Error("unexpected error out of plivo sip login" +
                    "'" + err + "'")
  })
}

const call_tel_num = function (creds, tel_num) {
  const plivo = new Plivo()
  return Promise.resolve().then(function () {
    return plivo.login(creds.user, creds.pass)
  }).then(function () {
    return plivo.call_tel_num(tel_num)
  })
}

var exports = {}

exports.check_sip_creds = check_sip_creds
exports.call_tel_num = call_tel_num

module.exports = exports
