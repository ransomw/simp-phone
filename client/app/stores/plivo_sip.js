const alt = require('../alt')

const PlivoSipActions = require('../actions/plivo_sip')

const _getExternalState = function (internalState) {
  return internalState
}

const PlivoSipStore = alt.createStore({
  displayName: 'PlivoSipStore',

  bindListeners: {
    set_checking_creds: [
      PlivoSipActions.check_sip_creds,
    ],
    unset_checking_creds: [
      PlivoSipActions._unset_checking_creds,
    ],
    set_sip_creds: [
      PlivoSipActions._set_sip_creds,
    ],
    set_call_media: [
      PlivoSipActions._set_call_media,
    ],
  },

  state: {
    checking_creds: false,
    creds: null,
    media: null,
  },

  config: {
    getState: _getExternalState
  },

  output: _getExternalState,

  set_checking_creds: function () {
    this.setState({checking_creds: true})
  },

  unset_checking_creds: function () {
    this.setState({checking_creds: false})
  },

  set_sip_creds: function (creds) {
    this.setState({creds: creds})
  },

  set_call_media: function (media) {
    this.setState({media: media})
  },

})

var exports = PlivoSipStore

module.exports = exports
