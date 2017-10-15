const R = require('ramda')
const I = require('immutable')
const Component = require('react').Component

const PlivoSipActions = require('../actions/plivo_sip')
const bind_handlers = require('./util/bind_handlers')
const call_conf = I.fromJS(require('./call_conf'))
const {
  increase_media_stream_gain,
} = require('./web_audio_util')

const rt_plivo_sip_call = require('../templates/plivo_sip_call.rt')

const CALL_ENDED_MSG_DISPLAY_MS = 1500

class PlivoSipCall extends Component {
  constructor(props) {
    super(props)
    bind_handlers(this, /(^h_)|(^ref_)|(^cb_)/)
    this.state = {
      loading: false,
      recently_ended: false,
      form_fields: {
        tel: '',
      },
    }
    // todo: dedupe
    this.h_click_call = R.partial(R.unless(
      () => this.props.ringing,
      this.h_click_call), [undefined])
    this.h_click_end = R.partial(R.when(
      () => this.props.media,
      this.h_click_end), [undefined])
    this.h_click_listen = R.partial(R.unless(
      () => this.props.getting_listener,
      this.h_click_listen), [undefined])
    this.ref_audio = R.unless(
      // el unmounted
      (el) => el === null,
      this.ref_audio)
  }

  componentWillReceiveProps(next_props) {
    if (this.props.media && !next_props.media) {
      this.setState({recently_ended: true})
      setTimeout(
        () => this.setState({recently_ended: false}),
        CALL_ENDED_MSG_DISPLAY_MS)
    }
    if (!this.props.answer_cb && next_props.answer_cb) {
      new Notification("what number shall i say is calling " +
                       "from accross the world?")
    }
  }

  mh_change_form_field(name_form_field) {
    const set_state = this.setState.bind(this)
    const h_change_form_field = function (updated_val) {
      set_state(function (state_prev) {
        const form_fields = state_prev.form_fields
        form_fields[name_form_field] = updated_val
        return {form_fields: form_fields}
      })
    }
    // numeric input only
    return R.compose(
      R.when((updated_val) => updated_val.match(/^\d*$/),
             h_change_form_field),
      R.prop('value'), R.prop('target')
    )
  }

  h_click_call() {
    const form_fields = this.state.form_fields
    PlivoSipActions.call_tel(this.props.creds, form_fields.tel)
  }

  h_click_end() {
    PlivoSipActions.hangup(this.props.media.end_call)
  }

  ref_audio(el) {
    if (!this.props.media || !this.props.media.mediaStream) {
      throw new Error("didn't find media stream for audio hookup")
    }
    const stream = this.props.media.mediaStream
    increase_media_stream_gain(stream, call_conf.get('gain'))
    el.srcObject = stream
  }

  cb_click_dialpad(token) {
    if (this.props.media) {
      if (!this.props.media.send_tone) {
        throw new Error("didn't find send_tone callback")
      }
      this.props.media.send_tone(typeof token === 'string' ?
                                 token : R.toString(token))
    } else {
      if (typeof token === 'number') {
        this.setState(function (state_prev) {
          const form_fields = state_prev.form_fields
          form_fields.tel += token
          return {form_fields: form_fields}
        })
      }
    }
  }

  h_click_listen() {
    PlivoSipActions.listen_for_calls()
  }

  h_click_close_listener() {
    PlivoSipActions.close_call_listener()
  }

  h_click_answer() {
    if (this.props.answer_cb) {
      this.props.answer_cb()
    } else {
      console.warn("didn't find answer_cb prop")
    }
  }

  render() {
    return rt_plivo_sip_call.call(this)
  }
}

var exports = PlivoSipCall

module.exports = PlivoSipCall
