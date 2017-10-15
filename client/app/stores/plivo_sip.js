const plivo = require('../plivo')
const alt = require('../alt')
const PlivoSipActions = require('../actions/plivo_sip')

const CALL_ERROR_MSG_DISPLAY_MS = 1500

const _getExternalState = function (internalState) {
  return internalState
}

const PlivoSipStore = alt.createStore({
  displayName: 'PlivoSipStore',

  bindListeners: {
    set_checking_creds: [
      PlivoSipActions.check_sip_creds,
    ],
    listen_for_calls: [
      PlivoSipActions.listen_for_calls,
    ],
    close_call_listener: [
      PlivoSipActions.close_call_listener,
    ],
    set_ringing: [
      PlivoSipActions.call_tel,
    ],
    set_hanging_up: [
      PlivoSipActions.hangup,
    ],
    unset_checking_creds: [
      PlivoSipActions._unset_checking_creds,
    ],
    set_sip_creds: [
      PlivoSipActions._set_sip_creds,
    ],
    unset_call_media: [
      PlivoSipActions._unset_call_media,
    ],
    set_call_media: [
      PlivoSipActions._set_call_media,
    ],
    set_login_error: [
      PlivoSipActions._set_login_error,
    ],
    unset_login_error: [
      PlivoSipActions.unset_login_error,
    ],
    set_err_call: [
      PlivoSipActions._set_err_call,
    ],
  },

  state: {
    checking_creds: false,
    ringing: false,
    hanging_up: false,
    err_call: null,
    getting_listener: false,
    creds: null,
    call_listener: null,
    answer_cb: null,
    login_error: null,
    media: null,
  },

  config: {
    getState: _getExternalState
  },

  output: _getExternalState,

  set_checking_creds: function () {
    this.setState({checking_creds: true})
  },

  listen_for_calls: function () {
    const creds = this.state.creds
    if (!creds) {
      let err = new Error("can't listen for calls without login creds")
      err.name = 'ImplementationError'
      throw err
    }
    this.setState({getting_listener: true})
    Promise.resolve().then(function () {
      if (Notification.permission === 'granted') {
        return null
      }
      return Notification.requestPermission()
    }).then(function (res) {
      // listen for calls, notifications or no
      return plivo.listen_for_calls(creds)
    }).then((call_listener) => {
      call_listener.on('phone_call', (answer_cb) => this.setState({
        answer_cb: () => {
          // async FP libs?
          return Promise.resolve().then(() => {
            return answer_cb()
          }).then((call_media) => {
            PlivoSipActions._set_call_media(call_media)
          }, (err) => {
            console.error("answer call error")
            console.error(err)
          }).then(() => this.setState({answer_cb: null}))
        },
      }))
      this.setState({
        getting_listener: false,
        call_listener: call_listener,
      })
    }, (err) => {
      console.error("error getting call listener")
      console.error(err)
      this.setState({getting_listener: false})
    })
  },

  close_call_listener: function () {
    if (this.state.call_listener) {
      this.state.call_listener.removeAllListeners()
      this.state.call_listener.close()
      this.setState({call_listener: null})
    }
  },

  unset_checking_creds: function () {
    this.setState({checking_creds: false})
  },

  set_ringing: function () {
    this.setState({ringing: true})
  },

  set_hanging_up: function () {
    this.setState({hanging_up: true})
  },

  set_sip_creds: function (creds) {
    this.setState({creds: creds})
  },

  set_call_media: function (media) {
    this.setState({
      media: media,
      ringing: false,
    })
  },

  unset_call_media: function () {
    this.setState({
      media: null,
      hanging_up: false,
    })
  },

  set_login_error: function (login_error) {
    this.setState({login_error: login_error})
  },

  unset_login_error: function () {
    this.setState({login_error: null})
  },

  set_err_call: function (err) {
    this.setState({
      err_call: err,
      ringing: false,
    })
    setTimeout(
      () => this.setState({err_call: null}),
      CALL_ERROR_MSG_DISPLAY_MS)
  },
})

var exports = PlivoSipStore

module.exports = exports
