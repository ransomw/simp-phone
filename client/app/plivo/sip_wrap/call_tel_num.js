const {
  make_timeout_promise_cb,
} = require('./util')
const {
  make_rtc_sess_init_pcb,
} = require('./jssip_rtc_sess')
const CallListener = require('./call_listener')
const {
  CALL_OPTS,
  timeouts,
  PHONE_REGEXP,
} = require('./const')

const call_tel_num = function (login_res, tel_num) {
  if (tel_num.search(PHONE_REGEXP) === -1) {
    const err = Error("invalid phone number '" + tel_num + "'")
    err.name = 'InvalidNumber'
    throw err
  }
  return new Promise(make_timeout_promise_cb(
    timeouts.get('call'), (resolve, reject) => {
      login_res.on(
        'newRTCSession', (data) => resolve(data.session))
      // mediaStream option can presumably used to avoid relying
      // on jssip to create the browser's "can i haz microphone?"
      login_res.call(tel_num, CALL_OPTS.toJS())
    })).then((rtc_sess) => {
      return new Promise(make_timeout_promise_cb(
        timeouts.get('call'),
        make_rtc_sess_init_pcb(rtc_sess)))
    })
}

var exports = call_tel_num

module.exports = exports
