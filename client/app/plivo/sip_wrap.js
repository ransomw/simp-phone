const R = require('ramda')
const imm = require('immutable')
const EventEmitter = require('events').EventEmitter
const WebSocketInterface = require('jssip').WebSocketInterface
const JssipUserAgent = require('jssip').UA

const PLIVIO_SIP_WS_URL = 'wss://phone.plivo.com:5063'
const CALL_OPTS = imm.fromJS({
  // mediaStream option can presumably used to avoid relying
  // on jssip to create the browser's "can i haz microphone?"
  mediaConstraints: {
    audio: true,
    video: false,
  },
  // defaults to 90 (sec)
  // bump to avoid 'Session Interval too Small' 422 resp
  sessionTimersExpires: 300,
  pcConfig: {iceServers: [{urls: [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
  ]}]},
})
const PHONE_REGEXP = new RegExp('^[0-9]{7}[0-9]*$')

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
    return new Promise(function (resolve, reject) {
      jssipUserAgent.on('registered', function () {
        resolve(self)
      })
      jssipUserAgent.on('registrationFailed', function (data) {
        self.close()
        reject(data.cause)
      })
      jssipUserAgent.start()
      self._ua = jssipUserAgent
    })
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
      return new Promise(function (resolve, reject) {
        // todo: add some way to reject ... optional timeout, perhaps
        self._ua.on('newRTCSession', (data) => resolve(data.session))
        self._ua.call(tel_num, CALL_OPTS.toJS())
      })
    }).then(function (rtc_sess) {
      bubble_events({
        on: rtc_sess.on.bind(rtc_sess),
        emit: self_emit,
      }, [
        'accepted',
        'ended',
      ], {prefix: 'rtc'})
      return new Promise(function (resolve, reject) {
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
      })
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
