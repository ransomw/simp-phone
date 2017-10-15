const R = require('ramda')
const EventEmitter = require('events').EventEmitter

const {
  make_timeout_promise_cb,
} = require('./util')
const {
  make_rtc_sess_init_pcb,
} = require('./jssip_rtc_sess')
const {
  CALL_OPTS,
  timeouts,
} = require('./const')

class CallListener extends EventEmitter {
  constructor(login_res) {
    super()
    const self_emit = R.nAry(2, super.emit.bind(this))
    login_res.on('newRTCSession', function (data) {
      if (data.originator !== 'remote') {
        let err = new Error("listener user agent expects only incoming")
        err.name = 'ImplementationError'
        throw err
      }
      const rtc_sess = data.session
      self_emit('phone_call', function () {
        const rtc_sess_init_p = new Promise(make_timeout_promise_cb(
          timeouts.get('call'),
          make_rtc_sess_init_pcb(rtc_sess)))
        rtc_sess.answer(CALL_OPTS)
        return Promise.resolve().then(function () {
          return rtc_sess_init_p
        })
      })
    })
    this.close = login_res.close
  }

  emit (eventName) {
    let err = new Error("")
    err.name = 'ImplementationError'
    throw err
  }
}

var exports = CallListener

module.exports = exports
