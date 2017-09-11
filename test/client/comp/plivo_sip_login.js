const R = require('ramda')
const React = require('react')
const proxyquire = require('proxyquire').noPreserveCache()
const {
  shallow: shallow,
} = require('enzyme')
const simple = require('simple-mock')
const {
  fromJS: immFromJS,
} = require('immutable')

const {
  path_app_src: path_app_src,
  delay: delay,
} = require('../util')

const plivo_stubs = {}

const alt = require(path_app_src + '/alt')

const PlivoSipActions = proxyquire(
  path_app_src + '/actions/plivo_sip',
  {
    '../plivo': plivo_stubs,
  }
)

const PlivoSipStore = proxyquire(
  path_app_src + '/stores/plivo_sip',
  {
    '../actions/plivo_sip': PlivoSipActions,
  }
)

const PlivoSipLogin = proxyquire(
  path_app_src + '/comp/plivo_sip_login',
  {
    '../actions/plivo_sip': PlivoSipActions,
  }
)

const CLICK_DELAY_MS = 300

const test_click_params = function (objs, t) {
  const {wrapper} = objs
  const user = 'bob'
  const pass = 'Temp321!'
  const spy_check_sip_creds = simple.mock(
    plivo_stubs, 'check_sip_creds').resolveWith(true)
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
    t.equal(spy_check_sip_creds.callCount, 1,
            "exactly one call to plivo spy")
    t.equal(PlivoSipActions.check_sip_creds.callCount, 1,
            "exactly one call to plivo action spy")
    t.deepEqual(plivo_stubs.check_sip_creds.lastCall.args,
                [user, pass],
                "username and password passed to stub")
  })
}

const test_checking_sip_creds = function (objs, t) {
  const {wrapper, props} = objs
  const input_el = wrapper.find('input').first()
  wrapper.setProps(props.set('checking_creds', true).toJS())
  wrapper.find('button').simulate('click')
  t.pass("clicked button")
  t.equal(PlivoSipActions.check_sip_creds.callCount, 0,
          "no calls to plivo action spy")
  t.equal(wrapper.state().form_fields.user, '',
          "username state empty before simulated input")
  t.ok(input_el.exists(), "have input element")
  t.notEqual(input_el.html().indexOf('username'), -1,
             // "somewhat flaky test on placeholder text" +
             "input element is the username input")
  input_el.simulate('change', {target: {value: 'A'}})
  t.equal(wrapper.state().form_fields.user, '',
          "username state empty after simulated input")
  t.end()
}

const test_click_authfail = function (objs, t) {
  const {wrapper} = objs
  simple.mock(plivo_stubs, 'check_sip_creds').resolveWith(false)
  return Promise.resolve().then(function () {
    t.ok(wrapper.find('button').exists(), "found button")
    wrapper.find('button').simulate('click')
  }).then(delay(CLICK_DELAY_MS)).then(function () {
    t.pass("clicked button")
    t.notOk(PlivoSipStore.getState().creds, "creds falsey")
  })
}

const test_click_login = function (objs, t) {
  const {wrapper} = objs
  simple.mock(plivo_stubs, 'check_sip_creds').resolveWith(true)
  return Promise.resolve().then(function () {
    t.ok(wrapper.find('button').exists(), "found button")
    wrapper.find('button').simulate('click')
  }).then(delay(CLICK_DELAY_MS)).then(function () {
    t.pass("clicked button")
    t.ok(PlivoSipStore.getState().creds, "creds non-null")
  })
}

const make_test = function (test_fn) {
  return function (t) {
    t.test("setup", function (t) {
      simple.restore()
      alt.recycle()
      t.end()
    })
    PlivoSipActions.check_sip_creds = simple.spy(
      PlivoSipActions.check_sip_creds)
    // Flux loop is _not_ closed in test
    t.test("run test", R.curry(test_fn)({
      wrapper: shallow(React.createElement(PlivoSipLogin)),
      props: immFromJS({
        checking_creds: false,
        creds: null,
        media: null,
      }),
    }))
    t.end()
  }
}

const tests_main = function (t) {
  t.test("component parameters passed to plivo",
         make_test(test_click_params))
  t.test("component inactive while checking creds",
         make_test(test_checking_sip_creds))
  t.test("login with failed authorization",
         make_test(test_click_authfail))
  t.test("click login",
         make_test(test_click_login))
  t.end()
}

var exports = tests_main

module.exports = exports
