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
        if (res.login_ok) {
          self._set_sip_creds(user, pass)
        } else {
          self._set_login_error(res.err_code)
        }
      }).catch(function (err) {
        console.error("plivo check sip creds error")
        console.error(err)
      }).then(function () {
        self._unset_checking_creds()
      })
    }
  },

  // todo: dispatch tel_num directly to store takes creds out of loop
  //    .. and get rid of _set_call_media action
  call_tel: function (creds, tel_num) {
    const self = this
    return function (dispatch) {
      dispatch()
      Promise.resolve().then(function () {
        return plivo.call_tel_num(creds, tel_num)
      }).then((res) => {
        self._set_call_media(res)
      }, (err) => {
        self._set_err_call(err)
      })
    }
  },

  hangup: function (end_call) {
    const self = this
    return function (dispatch) {
      dispatch()
      Promise.resolve().then(function () {
        return end_call()
      }).then(function (res) {
        self._unset_call_media()
      }, function (err) {
        console.error("end_call error")
        console.error(err)
      })
    }
  },

  listen_for_calls: function (creds) {
    return function (dispatch) {
      dispatch()
    }
  },

  close_call_listener: function () {
    return function (dispatch) {
      dispatch()
    }
  },

  unset_login_error: function () {
    return function (dispatch) {
      dispatch()
    }
  },

  _unset_call_media: function () {
    return function (dispatch) {
      dispatch()
    }
  },

  _unset_checking_creds: function () {
    return function (dispatch) {
      dispatch()
    }
  },

  _set_sip_creds: function (user, pass) {
    return {user: user, pass: pass}
  },

  _set_call_media: function(data) {
    const media = R.pick([
      'mediaStream',
      'mediaStreamTrack',
      'send_tone',
      'end_call',
    ], data)
    return media
  },

  _set_login_error: function (err_code) {
    return {
      err_code: err_code,
    }
  },

  _set_err_call: function (err) {
    return err
  },
})

var exports = PlivoSipActions

module.exports = exports
