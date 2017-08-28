const R = require('ramda')

const alt = require('../alt')
const plivo = require('../plivo')

const PlivoSipActions = alt.createActions({

  check_sip_creds: function (user, pass) {
    const self = this
    return function (dispatch) {
      dispatch()
      Promise.resolve().then(function () {
        return plivo.check_sip_creds(user, pass)
      }).then(function (res) {
        if (res) {
          self._set_sip_creds(user, pass)
        } else {
          console.error("login fail")
        }
      }).catch(function (err) {
        console.error("plivo check sip creds error")
        console.error(err)
      })
    }
  },

  call_tel: function (creds, tel_num) {
    const self = this
    return function (dispatch) {
      dispatch()
      Promise.resolve().then(function () {
        return plivo.call_tel_num(creds, tel_num)
      }).then(function (res) {
        self._set_call_media(res)
      }, function (err) {
        console.error("plivo.call_tell_num err")
        console.error(err)
      })
    }
  },

  _set_sip_creds: function (user, pass) {
    return {user: user, pass: pass}
  },

  _set_call_media: function(data) {
    const media = R.pick([
      'mediaStream',
      'mediaStreamTrack',
    ], data)

    console.log("setting call media (action)")
    console.log(media)

    return media
  },

})

var exports = PlivoSipActions

module.exports = exports
