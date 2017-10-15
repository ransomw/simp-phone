const R = require('ramda')
const I = require('immutable')
const React = require('react')
const proxyquire = require('proxyquire').noPreserveCache()
const simple = require('simple-mock')
const {
  shallow: shallow,
} = require('enzyme')

const {
  path_app_src: path_app_src,
} = require('../util')

const plivo_stubs = {}
const web_audio_util_stubs = {}

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
    '../plivo': plivo_stubs,
    '../actions/plivo_sip': PlivoSipActions,
  }
)

global.Notification = simple.mock().returnWith({})

const make_test = function (comp_name, test_fn) {
  const PlivoSipLogin = proxyquire(
    path_app_src + '/comp/' + comp_name,
    {
      '../actions/plivo_sip': PlivoSipActions,
      './web_audio_util': web_audio_util_stubs,
    }
  )
  return function (t) {
    t.test("setup", function (t) {
      simple.restore()
      alt.recycle()
      t.end()
    })
    R.forEach(function (action_name) {
      PlivoSipActions[action_name] = simple.spy(
        PlivoSipActions[action_name])
    }, ['check_sip_creds',
        'call_tel',
        'listen_for_calls',
        'close_call_listener',
       ])
    // Flux loop is _not_ closed in test
    t.test("run test", R.curry(test_fn)(
      shallow(React.createElement(PlivoSipLogin))
    ))
    t.end()
  }
}

const initial_store_state = I.fromJS({
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
})

var exports = {}

exports.plivo_stubs = plivo_stubs
exports.web_audio_util_stubs = web_audio_util_stubs
exports.PlivoSipActions = PlivoSipActions
exports.PlivoSipStore = PlivoSipStore
exports.make_test = make_test
exports.initial_store_state = initial_store_state

module.exports = exports
