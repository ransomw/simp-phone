const Component = require('react').Component

const PlivoSipActions = require('../actions/plivo_sip')

const rt_plivo_sip_login = require('../templates/plivo_sip_login.rt')

class PlivoSipLogin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      form_fields: {
        user: '',
        pass: ''
      }
    }
  }

  mh_change_form_field(name_form_field) {
    var self = this
    return function (ev) {
      if (self.props.checking_creds) {
        // monadic compose for this functionality?
        return
      }
      var val_updated = ev.target.value
      self.setState(function (state_prev) {
        var form_fields = state_prev.form_fields
        form_fields[name_form_field] = val_updated
        return {form_fields: form_fields}
      })
    }
  }

  h_click_login() {
    if (this.props.checking_creds) {
      // how to compose using class syntax?
      return
    }
    const form_fields = this.state.form_fields
    PlivoSipActions.check_sip_creds(form_fields.user, form_fields.pass)
  }

  render() {
    // note that .bind(this) needs be appended to handlers
    // todo: try to resolve for cleaner templates with no `.bind`
    return rt_plivo_sip_login.call(this)
  }
}

var exports = PlivoSipLogin

module.exports = exports
