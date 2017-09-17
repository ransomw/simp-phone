const R = require('ramda')
const imm = require('immutable')
const EventEmitter = require('events').EventEmitter
const WebSocketInterface = require('jssip').WebSocketInterface
const JssipUserAgent = require('jssip').UA

const _plivo_conf = require('./plivo_conf.json')
const PLIVIO_SIP_WS_URL = _plivo_conf.PLIVIO_SIP_WS_URL
const CALL_OPTS = imm.fromJS(_plivo_conf.CALL_OPTS)
const timeouts = imm.Map(_plivo_conf.timeouts)

const PHONE_REGEXP = new RegExp('^[0-9]{7}[0-9]*$')

const make_timeout_promise_cb = function (ms, orig_cb) {
  return function (resolve, reject) {
    // console.log("top of timeout promise callback")
    const timeout = setTimeout(function () {
      const err = new Error("timeout")
      err.name = 'timeout'
      reject(err)
    }, ms)
    const updated_resolve = function () {
      clearTimeout(timeout)
      resolve.apply(this, arguments)
    }
    R.nAry(2, orig_cb)(updated_resolve, reject)
  }
}

/**
 * ev_fns -- {on:(String, fn), emit:(String, Object)}
 * ev_names -- [String]
 * opt_args -- {omit:[String]}
 */
const bubble_events = function (ev_fns, ev_names, opt_args) {
  const opts = opt_args || {}
  opts.omit = opts.omit || []
  // ... functional style allows declarative lists
  R.forEach(R.compose(
    R.curry(R.apply)(
      ev_fns.on
    ),
    R.juxt([
      R.identity,
      (ev_name) => {
        return R.compose(
          R.curry(ev_fns.emit)(
            opts.prefix ? [opts.prefix, ev_name].join(':') : ev_name
          ),
          R.partial(R.omit, opts.omit))
      }])
  ), ev_names)
}

class Plivo extends EventEmitter {
  constructor() {
    super()
    this.sock = new WebSocketInterface(PLIVIO_SIP_WS_URL)
  }

  emit (eventName) {
    let err = new Error("")
    err.name = 'ImplementationError'
    throw err
  }

  login(user, pass) {
    const self = this
    const jssipUserAgent = new JssipUserAgent({
      sockets: [self.sock],
      uri: 'sip:' + user + '@phone.plivo.com',
      password: pass
    })
    bubble_events({
      on: jssipUserAgent.on.bind(jssipUserAgent),
      emit: R.nAry(2, super.emit.bind(this)),
    }, [
      'connecting',
      'connected',
    ], {omit: [
      'socket',
    ], prefix: 'ua'})
    const pcb = make_timeout_promise_cb(
      timeouts.get('login'),
      function (resolve, reject) {
        jssipUserAgent.on('registered', function () {
          resolve(self)
        })
        jssipUserAgent.on('registrationFailed', function (data) {
          self.close()
          reject(data.cause)
        })
        jssipUserAgent.start()
        self._ua = jssipUserAgent
      }
    )
    // console.log("made pcb") // prints before top of pcb
    return new Promise(pcb)
  }

  call_tel_num(tel_num) {
    const self = this
    const self_emit = R.nAry(2, super.emit.bind(this))
    return Promise.resolve().then(function () {
      if (!self._ua) {
        throw new Error("user agent not initialized")
      }
      if (tel_num.search(PHONE_REGEXP) === -1) {
        const err = Error("invalid phone number '" + tel_num + "'")
        err.name = 'InvalidNumber'
        throw err
      }
      const pcb = function (resolve, reject) {
        self._ua.on('newRTCSession', (data) => resolve(data.session))
        // mediaStream option can presumably used to avoid relying
        // on jssip to create the browser's "can i haz microphone?"
        self._ua.call(tel_num, CALL_OPTS.toJS())
      }
      return new Promise(make_timeout_promise_cb(
        timeouts.get('call'), pcb))
    }).then(function (rtc_sess) {
      bubble_events({
        on: rtc_sess.on.bind(rtc_sess),
        emit: self_emit,
      }, [
        'accepted',
        'ended',
      ], {prefix: 'rtc'})
      const pcb = function (resolve, reject) {
        rtc_sess.on('confirmed', function (ev) {
          const mediaStream = rtc_sess.connection.getRemoteStreams()[0]
          const rcvr = rtc_sess.connection.getReceivers()[0]
          if (mediaStream && rcvr) {
            resolve({
              mediaStream: mediaStream,
              mediaStreamTrack: rcvr.track,
              rtc_sess: rtc_sess,
            })
          } else {
            reject({
              msg: ("didn't find remote stream " +
                    "and media track after confirm"),
            })
          }
        })
        rtc_sess.on('failed', function (ev) {
          console.log("rtc_sess failed")
          reject({
            msg: "jssip rtcsession failed event",
            data: ev,
          })
        })
      }
      return new Promise(make_timeout_promise_cb(
        timeouts.get('call'), pcb))
    })
  }

  close() {
    if (this._ua) {
      this._ua.stop()
      this._ua = null
    }
  }
}

var exports = {}

exports.Plivo = Plivo

module.exports = exports
