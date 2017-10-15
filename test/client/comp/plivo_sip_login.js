const R = require('ramda')
const I = require('immutable')
const simple = require('simple-mock')

const {
  path_app_src: path_app_src,
  delay: delay,
} = require('../util')

const {
  err_codes: plivo_err_codes,
} = require(path_app_src + '/plivo/const')
const {
  plivo_stubs: plivo_stubs,
  PlivoSipActions: PlivoSipActions,
  PlivoSipStore: PlivoSipStore,
  make_test: make_comp_test,
  initial_store_state: initial_store_state,
} = require('./setup_teardown')

const make_test = R.curry(make_comp_test)('plivo_sip_login')

const props = initial_store_state
const user = 'bob'
const pass = 'Temp321!'

const LOGIN_ERR_MSG_DELAY_MS = 1800
const CLICK_DELAY_MS = 300
const RENDER_DELAY_MS = 300

const test_login_store_states = function (wrapper, t) {
  const spy_check_sip_creds = simple.mock(
    plivo_stubs, 'check_sip_creds'
  ).resolveWith({login_ok: true})
  wrapper.setState({form_fields: {user: user, pass: pass}})
  return Promise.resolve().then(function () {
    t.ok(wrapper.find('button').exists(), "found button")
    t.notOk(PlivoSipStore.getState().checking_creds,
            "falsey loading state before click")
    wrapper.find('button').simulate('click')
    t.pass("clicked button")
    t.ok(PlivoSipStore.getState().checking_creds,
         "truthy loading state after click")
  }).then(delay(CLICK_DELAY_MS)).then(function () {
    t.notOk(PlivoSipStore.getState().checking_creds,
            "loading state cleared after async")
    t.ok(PlivoSipStore.getState().creds,
         "creds truthy")
    t.notOk(PlivoSipStore.getState().login_error,
            "login error falsey")
    t.equal(spy_check_sip_creds.callCount, 1,
            "exactly one call to plivo spy")
    t.equal(PlivoSipActions.check_sip_creds.callCount, 1,
            "exactly one call to plivo action spy")
    t.deepEqual(plivo_stubs.check_sip_creds.lastCall.args,
                [user, pass],
                "username and password passed to stub")
  })
}

const _test_form_inactive = R.curryN(3, function (opts, wrapper, t) {
  const user_input_el = wrapper.find('input').first()
  const pass_input_el = wrapper.find('input').last()
  const button_el = wrapper.find('button')
  const {
    user: user_field,
    pass: pass_field,
  } = wrapper.state().form_fields
  t.notEqual(user_input_el.html().indexOf('username'), -1,
             // "somewhat flaky test on placeholder text" +
             "found the username input")
  t.notEqual(pass_input_el.html().indexOf('password'), -1,
             // "somewhat flaky test on placeholder text" +
             "found the password input")
  if (opts.button_exists) {
    t.ok(button_el.exists(),
            "found button element")
    button_el.simulate('click')
    t.pass("clicked button")
    t.equal(PlivoSipActions.check_sip_creds.callCount, 0,
            "no calls to plivo action spy")
  } else {
    t.notOk(button_el.exists(),
            "button element absent")
  }
  user_input_el.simulate('change', {target: {value: 'A'}})
  t.equal(wrapper.state().form_fields.user,
          user_field,
          "username state unchanged simulated input")
  pass_input_el.simulate('change', {target: {value: 'A'}})
  t.equal(wrapper.state().form_fields.pass,
          pass_field,
          "password state unchanged simulated input")
  t.end()
})

const test_ui_checking_creds = function (wrapper, t) {
  const input_el = wrapper.find('input').first()
  wrapper.setProps(props
                   .set('checking_creds', true)
                   .toJS())
  t.test("form inactive",
         R.partial(_test_form_inactive, [
           {button_exists: true},
           wrapper,
         ]))
  t.end()
}

const test_login_authfail_store_states = function (wrapper, t) {
  wrapper.setState({form_fields: {user: user, pass: pass + '%'}})
  simple.mock(
    plivo_stubs, 'check_sip_creds').resolveWith({
      login_ok: false,
      err_code: plivo_err_codes.get('auth'),
    })
  return Promise.resolve().then(function () {
    t.ok(wrapper.find('button').exists(),
         "found button")
    wrapper.find('button').simulate('click')
  }).then(delay(CLICK_DELAY_MS)).then(function () {
    t.pass("clicked button")
    t.notOk(PlivoSipStore.getState().creds,
            "creds falsey")
    t.ok(PlivoSipStore.getState().login_error,
         "login error truthy")
    t.deepEqual(PlivoSipStore.getState().login_error,
                {err_code: plivo_err_codes.get('auth')},
                "found the auth error code")
  })
}

const test_ui_login_authfail = function (wrapper, t) {
  const login_error_sel = '.login-error span'
  wrapper.setState({form_fields: {user: user, pass: pass + '%'}})
  PlivoSipActions._set_login_error(plivo_err_codes.get('auth'))
  wrapper.setProps(props
                   .set('login_error', I.Map({
                     err_code: plivo_err_codes.get('auth'),
                   }))
                   .toJS())
  t.test("form inactive",
         R.partial(_test_form_inactive, [
           {button_exists: false},
           wrapper,
         ]))
  t.test("error display unwind", function (t) {
    return Promise.resolve().then(function () {
      t.ok(PlivoSipStore.getState().login_error,
           "truthy login error state")
      t.ok(wrapper.find(login_error_sel).exists(),
           "found login error message")
      t.notEqual(wrapper.find(login_error_sel)
                 .first().text().indexOf('auth'), -1,
                 "found 'auth' in error message")
      t.notEqual(wrapper.state().form_fields.pass, '',
                 "nonempty password string")
    }).then(delay(LOGIN_ERR_MSG_DELAY_MS)).then(function () {
      t.notOk(PlivoSipStore.getState().login_error,
              "falsey login error state")
      wrapper.setProps(props.toJS())
    }).then(delay(RENDER_DELAY_MS)).then(function () {
      t.notOk(wrapper.find(login_error_sel).exists(),
              "login error message absent")
      t.equal(wrapper.state().form_fields.pass, '',
              "empty password string")
    })
  })
  t.end()
}

const tests_main = function (t) {
  t.test("store states on component parameters passed to plivo",
         make_test(test_login_store_states))
  t.test("ui behavior on component inactive while checking creds",
         make_test(test_ui_checking_creds))
  t.test("store states on login with failed authorization",
         make_test(test_login_authfail_store_states))
  t.test("ui behavior on login with failed authorization",
         make_test(test_ui_login_authfail))
  t.end()
}

var exports = tests_main

module.exports = exports
