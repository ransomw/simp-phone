const EventEmitter = require('events').EventEmitter
const WebSocketInterface = require('jssip').WebSocketInterface
const JssipUserAgent = require('jssip').UA

const PLIVIO_SIP_WS_URL = 'wss://phone.plivo.com:5063'
const PLIVO_SESSION_TIMERS_EXPIRES = 300
const PLIVO_STUN_SERVERS = Object.freeze([
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
])

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
    const emit = super.emit.bind(this)

    return new Promise(function (resolve, reject) {
      const jssipUserAgent = new JssipUserAgent({
        sockets: [self.sock],
        uri: 'sip:' + user + '@phone.plivo.com',
        password: pass
      })

      // these can be _all_ wired to super.emit('signal', data),
      // more cohesively pruning off private (e.g. data.socket) data
      // and including all useful data from upstream api
      // (ramda)
      jssipUserAgent.on('connecting', function (data) {
        // can `super` be used in here?
        emit('connecting', {attempts: data.attempts})
      })

      jssipUserAgent.on('connected', function (data) {
        emit('connected', {})
      })

      jssipUserAgent.on('registered', function () {
        resolve(self)
      })

      jssipUserAgent.on('registrationFailed', function (data) {
        // todo: don't try reconnects if the password is wrong
        reject(data.cause)
      })

      jssipUserAgent.start()

      self._ua = jssipUserAgent
    })
  }

  call_tel_num(tel_num) {
    const self = this
    //todo: check formatting of number in this class
    if (!self._ua) {
      throw new Error("user agent not initialized")
    }

    return new Promise(function (resolve, reject) {
      // todo: add some way to reject ... optional timeout, perhaps
      self._ua.on('newRTCSession', function (data) {
        // http://jssip.net/documentation/3.0.x/api/session/
        const rtcSess = data.session

        rtcSess.on('accepted', function (ev) {
          console.log("rtcSess accepted")
          console.log(ev)
        })

        rtcSess.on('confirmed', function (ev) {
          console.log("rtcSess confirmed")
          console.log(ev)
          console.log("with current rtcSess")
          console.log(rtcSess)
          const mediaStreams = rtcSess.connection.getRemoteStreams()
          const rcvrs = rtcSess.connection.getReceivers()
          const mediaStream = mediaStreams[0]
          const rcvr = rcvrs[0]
          console.log("all streams and recievers")
          console.log(mediaStreams)
          console.log(rcvrs)
          if (mediaStream && rcvr) {
            resolve({
              mediaStream: mediaStream,
              mediaStreamTrack: rcvr.track,
              rtcSess: rtcSess,
            })
          } else {
            reject({
              msg: ("didn't find remote stream " +
                    "and media track after confirm"),
            })
          }
        })

        rtcSess.on('ended', function (ev) {
          console.log("rtcSess ended")
          console.log(ev)
        })

        rtcSess.on('failed', function (ev) {
          console.log("rtcSess failed")
          reject({
            msg: "jssip rtcsession failed event",
            data: ev,
          })
        })

        rtcSess.on('addstream', function (ev) {
          const audioStream = ev.stream
          console.log("rtcSess addstream")
          console.log(ev)
          console.log("audioStream: " + audioStream)
        })

      })

      self._ua.call(tel_num, {
        // mediaStream option can presumably used to avoid relying
        // on jssip to create the browser's "can i haz microphone?"
        mediaConstraints: {
          audio: true,
          video: false,
        },
        // defaults to 90 (sec)
        // bump to avoid 'Session Interval too Small' 422 resp
        sessionTimersExpires: PLIVO_SESSION_TIMERS_EXPIRES,
        pcConfig: {iceServers: [{urls: PLIVO_STUN_SERVERS}]},
      })
    })
  }

  close() {
    if (this._ua) {
      this._ua.stop()
      this._ua = null
    }
    // there's probably a signal (callback, heck) to catch here
  }
}

var exports = {}

exports.Plivo = Plivo

module.exports = exports
