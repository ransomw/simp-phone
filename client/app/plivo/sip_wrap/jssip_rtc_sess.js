const R = require('ramda')

const {
  make_timeout_promise_cb,
} = require('./util')

const {
  timeouts,
} = require('./const')

const make_end_call = function (rtc_sess) {
  return function () {
    const end_pcb = function (resolve, reject) {
      rtc_sess.on('ended', (data) => resolve({
        terminated: true,
        ev_data: R.pick([
          // 'local', 'remote', or 'system'
          'originator',
          // defined in JsSIP.C.causes
          'cause',
        ], data),
      }))
      rtc_sess.terminate()
    }
    if (rtc_sess.isEnded()) {
      return Promise.resolve({terminated: false})
    } else {
      return new Promise(make_timeout_promise_cb(
        timeouts.get('end'), end_pcb))
    }
  }
}

// this could be a class...
const rtc_sess_2_call_media = function (rtc_sess) {
  const mediaStream = rtc_sess.connection.getRemoteStreams()[0]
  const rcvr = rtc_sess.connection.getReceivers()[0]
  const localStream = rtc_sess.connection.getLocalStreams()[0]
  const dtmfSender = rtc_sess.connection
        .createDTMFSender(localStream.getAudioTracks()[0])
  if (!(mediaStream && rcvr)) {
    return null
  }
  return {
    mediaStream: mediaStream,
    mediaStreamTrack: rcvr.track,
    send_tone: function (tone) {

      console.log("trying to send tone '" + tone + "'")

      dtmfSender.insertDTMF(tone)
    },
    end_call: make_end_call(rtc_sess),
  }
}

const make_rtc_sess_init_pcb = function (rtc_sess) {
  return function (resolve, reject) {
    rtc_sess.on('confirmed', function (ev) {
      const call_media = rtc_sess_2_call_media(rtc_sess)
      if (call_media) {
        resolve(call_media)
      } else {
        reject({
          msg: ("didn't find remote stream " +
                "and media track after confirm"),
        })
      }
    })
    rtc_sess.on('failed', function (ev) {
      console.warn("rtc_sess failed")
      console.warn(ev)
      reject({
        msg: "jssip rtcsession failed event",
        data: ev,
      })
    })
  }
}

var exports = {}

exports.make_rtc_sess_init_pcb = make_rtc_sess_init_pcb

module.exports = exports
