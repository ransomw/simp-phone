const R = require('ramda')
const Component = require('react').Component

const PlivoSipActions = require('../actions/plivo_sip')
const bind_handlers = require('./util/bind_handlers')

const rt_plivo_sip_login = require('../templates/plivo_sip_login.rt')

const LOGIN_ERROR_MSG_DISPLAY_MS = 1500

class PlivoSipLogin extends Component {
  constructor(props) {
    super(props)
    bind_handlers(this, /^h_/)
    this.state = {
      form_fields: {
        user: '',
        pass: ''
      }
    }
    // ramda iss #690 regarding the `partial`
    this.h_click_login = R.partial(R.unless(
      () => this.props.checking_creds,
      this.h_click_login), [undefined])
  }

  componentWillReceiveProps(next_props) {
    if (next_props.login_error) {
      setTimeout(
        () => PlivoSipActions.unset_login_error(),
        LOGIN_ERROR_MSG_DISPLAY_MS)
    }
    if (this.props.login_error && !next_props.login_error) {
      this.setState(function (state_prev) {
        const form_fields = state_prev.form_fields
        form_fields.pass = ''
        return {form_fields: form_fields}
      })
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
    return R.compose(
      R.unless(() => (this.props.checking_creds ||
                        this.props.login_error),
               h_change_form_field),
      R.prop('value'), R.prop('target')
    )
  }

  h_click_login() {
    const form_fields = this.state.form_fields
    PlivoSipActions.check_sip_creds(form_fields.user, form_fields.pass)
  }

  render() {
    return rt_plivo_sip_login.call(this)
  }
}

var exports = PlivoSipLogin

module.exports = exports
