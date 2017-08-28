const alt = require('../alt')

const PlivoSipActions = require('../actions/plivo_sip')

const _getExternalState = function (internalState) {
  return internalState
}

const PlivoSipStore = alt.createStore({
  displayName: 'PlivoSipStore',

  bindListeners: {
    set_sip_creds: PlivoSipActions._set_sip_creds,
    set_call_media: PlivoSipActions._set_call_media,
  },

  state: {
    creds: null,
    media: null,
  },

  config: {
    getState: _getExternalState
  },

  output: _getExternalState,

  set_sip_creds: function (creds) {
    this.setState({creds: creds})
  },

  set_call_media: function (media) {
    this.setState({media: media})
  },

})

var exports = PlivoSipStore

module.exports = exports
