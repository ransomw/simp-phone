const React = require('react')
const proxyquire = require('proxyquire').noPreserveCache()
const {
  shallow: shallow,
} = require('enzyme')
const simple = require('simple-mock')

const {
  path_app_src: path_app_src,
  delay: delay,
} = require('../util')

const plivo_stubs = require('./plivo_stubs')

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

const test_click_params = function (t) {
  const user = 'bob'
  const pass = 'Temp321!'
  const wrapper = shallow(React.createElement(PlivoSipLogin))
  wrapper.setState({form_fields: {user: user, pass: pass}})
  simple.restore()
  alt.recycle()
  return Promise.resolve().then(function () {
    t.ok(wrapper.find('button').exists(), "found button")
    simple.mock(plivo_stubs, 'check_sip_creds').returnWith(true)
    wrapper.find('button').simulate('click')
  }).then(delay(CLICK_DELAY_MS)).then(function () {
    t.pass("clicked button")
    t.deepEqual(plivo_stubs.check_sip_creds.lastCall.args,
                [user, pass],
                "username and password passed to stub")
  })
}


const test_click_authfail = function (t) {
  const wrapper = shallow(React.createElement(PlivoSipLogin))
  simple.restore()
  alt.recycle()
  return Promise.resolve().then(function () {
    t.ok(wrapper.find('button').exists(), "found button")
    simple.mock(plivo_stubs, 'check_sip_creds').returnWith(false)
    wrapper.find('button').simulate('click')
  }).then(delay(CLICK_DELAY_MS)).then(function () {
    t.pass("clicked button")
    t.notOk(PlivoSipStore.getState().creds, "creds falsey")
  })
}

const test_click_login = function (t) {
  const wrapper = shallow(React.createElement(PlivoSipLogin))
  simple.restore()
  alt.recycle()
  return Promise.resolve().then(function () {
    t.ok(wrapper.find('button').exists(), "found button")
    simple.mock(plivo_stubs, 'check_sip_creds').returnWith(true)
    wrapper.find('button').simulate('click')
  }).then(delay(CLICK_DELAY_MS)).then(function () {
    t.pass("clicked button")
    t.ok(PlivoSipStore.getState().creds, "creds non-null")
  })
}

const tests_main = function (t) {
  t.test("component parameters passed to plivo", test_click_params)
  t.test("login with failed authorization", test_click_authfail)
  t.test("click login", test_click_login)
  t.end()
}

var exports = tests_main

module.exports = exports
