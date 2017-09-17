const Component = require('react').Component

const PlivoSipActions = require('../actions/plivo_sip')

const rt_plivo_sip_call = require('../templates/plivo_sip_call.rt')

// props.media.mediaStream
// props.media.mediaStreamTrack

class PlivoSipCall extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      form_fields: {
        tel: '',
      }
    }
  }

  mh_change_form_field(name_form_field) {
    var self = this
    return function (ev) {
      var val_updated = ev.target.value
      self.setState(function (state_prev) {
        var form_fields = state_prev.form_fields
        form_fields[name_form_field] = val_updated
        return {form_fields: form_fields}
      })
    }
  }

  h_click_call() {
    const form_fields = this.state.form_fields
    PlivoSipActions.call_tel(this.props.creds, form_fields.tel)
  }

  ref_audio(el) {
    console.log("considering hooking up audio " +
                "using react ref and srcObjct")
    console.log(el)
    if (this.props.media.mediaStream) {
      console.log("setting audio media stream")
      el.srcObject = this.props.media.mediaStream
      console.log(el)
    } else {
      console.warn("didn't find media stream")
    }
  }

  cb_click_dialpad(token) {
    console.log("d"+token)
  }

  render() {
    // note that .bind(this) needs be appended to handlers
    // todo: try to resolve for cleaner templates with no `.bind`
    return rt_plivo_sip_call.call(this)
  }
}

var exports = PlivoSipCall

module.exports = PlivoSipCall
