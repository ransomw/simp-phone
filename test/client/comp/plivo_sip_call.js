const R = require('ramda')
const I = require('immutable')
const simple = require('simple-mock')
const EventEmitter = require('events').EventEmitter

const {
  delay: delay,
} = require('../util')

const {
  plivo_stubs: plivo_stubs,
  PlivoSipActions: PlivoSipActions,
  PlivoSipStore: PlivoSipStore,
  make_test: make_comp_test,
  initial_store_state: initial_store_state,
} = require('./setup_teardown')

const make_test = R.curry(make_comp_test)('plivo_sip_call')

const PROMISE_DELAY_MS = 300
const CALL_ENDED_MSG_DELAY_MS = 1800
const INVALID_NUMBER_MSG_DELAY_MS = 1800

const props = initial_store_state.set('creds', I.Map({}))

const test_numeric_input_only = function (wrapper, t) {
  const input_el = wrapper.find('input').first()
  t.ok(input_el.exists(), "found input element")
  t.equal(wrapper.state().form_fields.tel, '',
          "no phone number on load")
  input_el.simulate('change', {target: {value: '1'}})
  t.equal(wrapper.state().form_fields.tel, '1',
          "phone number changed after numeric input")
  input_el.simulate('change', {target: {value: 'A'}})
  t.equal(wrapper.state().form_fields.tel, '1',
          "phone number unchanged after non-numeric input")
  t.end()
}

const _make_resolvable_promise = function () {
  let the_resolver
  let the_rejecter
  const the_promise = new Promise((resolve, reject) => {
    the_resolver = resolve
    the_rejecter = reject
  })
  return {
    resolver: the_resolver,
    rejecter: the_rejecter,
    promise: the_promise,
  }
}

const call_btn_sel = 'button.call'
const mock_call_media = {
  mediaStream: 'mock_mediaStream',
  mediaStreamTrack: 'mock_mediaStreamTrack',
  send_tone: 'mock_send_tone',
}

const test_call_success_store_states = function (wrapper, t) {
  const {
    resolver: mock_call_tel_num_resolver,
    promise: mock_call_tel_num_promise,
  } = _make_resolvable_promise()
  const mock_call_tel_num = simple.mock(
    plivo_stubs, 'call_tel_num').callFn(function () {
      return mock_call_tel_num_promise
    })
  t.ok(wrapper.find(call_btn_sel).exists(),
       "found call button")
  wrapper.setState({form_fields: {tel: '16665551234'}})
  return Promise.resolve().then(() => {
    t.notOk(PlivoSipStore.getState().ringing,
            "falsey ringing state before click")
    t.notOk(PlivoSipStore.getState().media,
            "falsey media state before click")
    wrapper.find(call_btn_sel).first().simulate('click')
    t.pass("clicked call button")
  }).then(delay(PROMISE_DELAY_MS)).then(() => {
    t.ok(PlivoSipStore.getState().ringing,
         "truthy ringing state after click")
    t.notOk(PlivoSipStore.getState().media,
            "falsey media state after click")
    mock_call_tel_num_resolver(mock_call_media)
  }).then(delay(PROMISE_DELAY_MS)).then(() => {
    t.notOk(PlivoSipStore.getState().ringing,
            "falsey ringing state after call resolve (success)")
    t.ok(PlivoSipStore.getState().media,
         "truthy media state after call resolve (success)")
    t.deepEqual(PlivoSipStore.getState().media,
                mock_call_media,
                "in fact, it is the mock media that resolved")
  })
}

const invalid_number = '5551234'
const err_invalid_number = Error(
  "invalid phone number '" + invalid_number + "'")
err_invalid_number.name = 'InvalidNumber'

const test_call_invalid_number_store_states = function (wrapper, t) {
  const {
    rejecter: mock_call_tel_num_rejecter,
    promise: mock_call_tel_num_promise,
  } = _make_resolvable_promise()
  const mock_call_tel_num = simple.mock(
    plivo_stubs, 'call_tel_num').callFn(function () {
      return mock_call_tel_num_promise
    })
  wrapper.setState({form_fields: {tel: invalid_number}})
    return Promise.resolve().then(() => {
    wrapper.find(call_btn_sel).first().simulate('click')
    t.pass("clicked call button")
  }).then(delay(PROMISE_DELAY_MS)).then(() => {
    t.ok(PlivoSipStore.getState().ringing,
         "truthy ringing state after click")
    t.notOk(PlivoSipStore.getState().err_call,
            "falsey call error state after click")
    mock_call_tel_num_rejecter(err_invalid_number)
  }).then(delay(PROMISE_DELAY_MS)).then(() => {
    t.notOk(PlivoSipStore.getState().ringing,
            "falsey ringing state after call_tel_num reject")
    t.ok(PlivoSipStore.getState().err_call,
         "truthy call error state after call_tel_num reject")
    t.ok(PlivoSipStore.getState().err_call instanceof Error,
         "err_call is an instance of Error")
    t.equal(PlivoSipStore.getState().err_call.name,
            err_invalid_number.name,
            "with the expected name")
  }).then(delay(INVALID_NUMBER_MSG_DELAY_MS)).then(() => {
    t.notOk(PlivoSipStore.getState().err_call,
            "call error state unset after delay")
  })
}

const listener_btn_sel = '.call-listener button'

class MockCallListener extends EventEmitter {
  emit_phone_call() {
    const rp = _make_resolvable_promise()
    const answer_cb_mock = simple.mock().returnWith(rp.promise)
    this.emit('phone_call', answer_cb_mock)
    return {
      resolver: rp.resolver,
      rejecter: rp.rejecter,
      answer_cb_mock: answer_cb_mock,
    }
  }
}

const mock_call_listener = new MockCallListener()

const user = 'bob'
const pass = 'Temp321!'

const _setup_listen_for_calls_mock = function () {
  simple.mock(Notification, 'requestPermission').callFn(function () {
    Notification.permission = 'granted'
    return Promise.resolve({})
  })
  const {
    resolver: mock_listen_for_calls_resolver,
    promise: mock_listen_for_calls_promise,
  } = _make_resolvable_promise()
  PlivoSipActions._set_sip_creds(user, pass)
  const mock_listen_for_calls = simple.mock(
    plivo_stubs, 'listen_for_calls').callFn(function () {
      return mock_listen_for_calls_promise
    })
  return {
    mock_listen_for_calls_resolver: mock_listen_for_calls_resolver,
  }
}

const test_listen_success_store_states = function (wrapper, t) {
  const {
    mock_listen_for_calls_resolver,
  } = _setup_listen_for_calls_mock()
  t.ok(wrapper.find(listener_btn_sel).exists(),
       "found listener button")
  t.equal(wrapper.find(listener_btn_sel).first().text(),
          "listen",
          "it's the listen button")
  return Promise.resolve().then(() => {
    t.notOk(PlivoSipStore.getState().getting_listener,
            "falsey getting_listener state before click")
    t.notOk(PlivoSipStore.getState().call_listener,
            "falsey call_listener state before click")
    t.equal(Notification.requestPermission.callCount, 0,
            "no calls to Notification.requestPermission")
    wrapper.find(listener_btn_sel).first().simulate('click')
    t.pass("clicked listener button")
  }).then(delay(PROMISE_DELAY_MS)).then(() => {
    t.equal(Notification.requestPermission.callCount, 1,
            "called Notification.requestPermission")
    t.ok(PlivoSipStore.getState().getting_listener,
            "truthy getting_listener state before click")
    t.notOk(PlivoSipStore.getState().call_listener,
            "falsey call_listener state before click")
    mock_listen_for_calls_resolver(mock_call_listener)
  }).then(delay(PROMISE_DELAY_MS)).then(() => {
    t.notOk(PlivoSipStore.getState().getting_listener,
            "falsey getting_listener state after resolve")
    t.ok(PlivoSipStore.getState().call_listener,
         "truthy call_listener state after resolve")
    t.equal(PlivoSipStore.getState().call_listener,
            mock_call_listener,
            "in fact, it's the mock listener object")
  })
}

const test_ui_ringing = function (wrapper, t) {
  wrapper.setProps(props
                   .set('ringing', true)
                   .toJS())
  t.ok(wrapper.find(call_btn_sel).exists(),
       "found call button")
  t.ok(wrapper.find('.phone-hook .button .overlay').exists(),
       "found ringing overlay")
  t.equal(PlivoSipActions.call_tel.callCount, 0,
          "no calls to call_tel action spy before click")
  wrapper.find(call_btn_sel).first().simulate('click')
  t.pass("clicked call button")
  t.equal(PlivoSipActions.call_tel.callCount, 0,
          "no calls to call_tel action spy after click")
  t.end()
}

const test_ui_getting_listener = function (wrapper, t) {
  PlivoSipActions._set_sip_creds(user, pass)
  wrapper.setProps(props
                   .set('getting_listener', true)
                   .toJS())
  t.ok(wrapper.find(listener_btn_sel).exists(),
       "found listener button")
  t.equal(wrapper.find(listener_btn_sel).first().text(),
          "listen",
          "it's the listen button")
  t.ok(wrapper.find('section.call-listener .button .overlay').exists(),
       "found getting listener overlay")
  t.equal(PlivoSipActions.listen_for_calls.callCount, 0,
          "no calls to listen_for_calls action spy before click")
  wrapper.find(listener_btn_sel).first().simulate('click')
  t.pass("clicked listener button")
  t.equal(PlivoSipActions.listen_for_calls.callCount, 0,
          "no calls to listen_for_calls action spy after click")
  t.end()
}

const end_btn_sel = 'button.end'

const test_ui_connected = function (wrapper, t) {
  wrapper.setProps(props
                   .set('media', I.Map({}))
                   .toJS())
  t.notOk(wrapper.find(call_btn_sel).exists(),
          "call button absent")
  t.ok(wrapper.find(end_btn_sel).exists(),
       "found end button")
  t.end()
}

const test_ui_listening = function (wrapper, t) {
  wrapper.setProps(props
                   .set('call_listener', mock_call_listener)
                   .toJS())
  t.ok(wrapper.find(listener_btn_sel).exists(),
       "found listener button")
  t.equal(wrapper.find(listener_btn_sel).first().text(),
          "close",
          "it's the close button")
  t.end()
}

const test_close_success_store_states = function (wrapper, t) {
  const {
    mock_listen_for_calls_resolver,
  } = _setup_listen_for_calls_mock()
  PlivoSipActions.listen_for_calls()
  simple.mock(mock_call_listener, 'close').returnWith(undefined)
  mock_listen_for_calls_resolver(mock_call_listener)
  wrapper.setProps(props
                   .set('call_listener', mock_call_listener)
                   .toJS())
  return Promise.resolve().then(
    delay(PROMISE_DELAY_MS)
  ).then(() => {
    t.ok(PlivoSipStore.getState().call_listener,
         "truthy listener object in store")
    t.equal(PlivoSipActions.close_call_listener.callCount, 0,
            "no calls to close_call_listener action before click")
    t.equal(mock_call_listener.close.callCount, 0,
            "no count to call listener close mock before click")
    wrapper.find(listener_btn_sel).first().simulate('click')
    t.pass("clicked listener button")
    t.equal(mock_call_listener.close.callCount, 1,
            "called listener close mock")
    t.equal(PlivoSipActions.close_call_listener.callCount, 1,
         "called close_call_listener action")
  }).then(delay(PROMISE_DELAY_MS)).then(() => {
    t.notOk(PlivoSipStore.getState().call_listener,
            "falsey call listener after close")
  })
}

// this is entirely about the store: ev not emitted by ui
// .. here 'til enough pure flux tests to refactor
const test_incoming_call_store_states = function (wrapper, t) {
  const {
    mock_listen_for_calls_resolver,
  } = _setup_listen_for_calls_mock()
  PlivoSipActions.listen_for_calls()
  mock_listen_for_calls_resolver(mock_call_listener)
  let answer_cb_resolver
  let answer_cb_mock
  return Promise.resolve().then(
    delay(PROMISE_DELAY_MS)
  ).then(() => {
    t.equal(PlivoSipStore.getState().call_listener,
            mock_call_listener,
            "mock listener object in store")
    t.notOk(PlivoSipStore.getState().answer_cb,
            "answer callback absent before phone call event")
    const {
      resolver: resolver,
      answer_cb_mock: cb_mock,
    } = mock_call_listener.emit_phone_call()
    answer_cb_resolver = resolver
    answer_cb_mock = cb_mock
  }).then(delay(PROMISE_DELAY_MS)).then(() => {
    const answer_cb = PlivoSipStore.getState().answer_cb
    t.ok(answer_cb,
         "found answer callback after phone call event")
    t.equal(answer_cb_mock.callCount, 0,
            "no calls to answer callback mock before calling")
    answer_cb()
  }).then(delay(PROMISE_DELAY_MS)).then(() => {
    t.equal(answer_cb_mock.callCount, 1,
            "called the mock via the store state callback")
  }).then(delay(PROMISE_DELAY_MS)).then(() => {
    t.notOk(PlivoSipStore.getState().media,
            "media absent before resolving answer callback promise")
    answer_cb_resolver(mock_call_media)
  }).then(delay(PROMISE_DELAY_MS)).then(() => {
    t.ok(PlivoSipStore.getState().media,
         "found media after resolving answer callback promise")
    t.notOk(PlivoSipStore.getState().answer_cb,
            "answer callback absent from store state")
    t.deepEqual(PlivoSipStore.getState().media,
                mock_call_media,
                "..and it's the mock call media")
  })
}

const test_ui_incoming_call = function (wrapper, t) {
  const {
    resolver: answer_cb_resolver,
    answer_cb_mock: answer_cb_mock,
  } = mock_call_listener.emit_phone_call()
  const props_listening = props.set('call_listener', mock_call_listener)
  wrapper.setProps(props_listening.toJS())
  t.equal(Notification.callCount, 0,
          "no calls to Notification before setting answer callback")
  wrapper.setProps(props_listening
                   .set('answer_cb', answer_cb_mock)
                   .toJS())
  t.equal(Notification.callCount, 1,
          "Notification called on setting answer callback")
  t.equal(R.keys(Notification.lastCall.context).length, 0,
          // somewhat hacky check on
          "Notification called as a constructor")
  t.ok(wrapper.find(listener_btn_sel).exists(),
       "found listener button")
  t.equal(wrapper.find(listener_btn_sel).first().text(),
          "answer",
          "it's the answer button")
  t.equal(answer_cb_mock.callCount, 0,
          "no calls to answer callback")
  wrapper.find(listener_btn_sel).first().simulate('click')
  t.pass("clicked answer")
  t.equal(answer_cb_mock.callCount, 1,
          "answer callback hit")
  t.end()
}

const test_hangup_success_store_states = function (wrapper, t) {
  const {
    resolver: mock_end_call_resolver,
    promise: mock_end_call_promise,
  } = _make_resolvable_promise()
  const spy_end_call = simple.stub()
        .resolveWith(mock_end_call_promise)
  PlivoSipActions._set_call_media(mock_call_media)
  wrapper.setProps(props
                   .set('media', I.Map({
                     end_call: spy_end_call,
                   }))
                   .toJS())
  t.ok(PlivoSipStore.getState().media,
       "truthy media state before hangup")
  return Promise.resolve().then(() => {
    t.notOk(PlivoSipStore.getState().hanging_up,
            "falsey hanging_up state before click")
    wrapper.find(end_btn_sel).first().simulate('click')
    t.pass("clicked end button")
  }).then(delay(PROMISE_DELAY_MS)).then(() => {
    t.ok(PlivoSipStore.getState().hanging_up,
         "truthy hanging_up state after click")
    t.equal(spy_end_call.callCount, 1,
            "got call to end_call spy")
    t.ok(PlivoSipStore.getState().media,
            "truthy media state before end call resolve")
    mock_end_call_resolver({})
  }).then(delay(PROMISE_DELAY_MS)).then(() => {
    t.notOk(PlivoSipStore.getState().hanging_up,
            "falsey hanging_up state after end call resolve (success)")
    t.notOk(PlivoSipStore.getState().media,
            "falsey media state after end call resolve")
  })
}

const call_status_sel = '.call-status span'

const test_ui_hangup = function (wrapper, t) {
  wrapper.setProps(props
                   .set('hanging_up', true)
                   .set('media', I.Map({}))
                   .toJS())
  t.ok(wrapper.find(end_btn_sel).exists(), "found end button")
  t.ok(wrapper.find('.phone-hook .button .overlay').exists(),
       "found hanging up overlay")
  t.notOk(wrapper.find(call_status_sel).exists(),
          "call call status element absent")
  wrapper.setProps(props.toJS())
  return Promise.resolve().then(() => {
    t.notOk(wrapper.find(call_btn_sel).exists(),
            "call button absent immediately after hangup finished")
    t.notOk(wrapper.find(end_btn_sel).exists(),
            "end button absent immediately after hangup finished")
    t.ok(wrapper.find(call_status_sel).exists(),
         "found call call status element")
    t.equal(wrapper.find(call_status_sel).first().text().trim(),
            "call ended",
            ".. and it's displaying the ended message")
  }).then(delay(CALL_ENDED_MSG_DELAY_MS)).then(() => {
    t.ok(wrapper.find(call_btn_sel).exists(),
            "call button visible immediately after delay")
    t.notOk(wrapper.find(end_btn_sel).exists(),
            "end button absent immediately after delay")
    t.notOk(wrapper.state().recently_ended,
            "recently_ended state set to false after delay")
    t.notOk(wrapper.find(call_status_sel).exists(),
         "call call status element absent after delay")
  })
}

const test_ui_invalid_number = function (wrapper, t) {
  wrapper.setProps(props
                   .set('err_call', err_invalid_number)
                   .toJS())
  t.ok(wrapper.find(call_status_sel).exists(),
       "found call call status element")
  t.equal(wrapper.find(call_status_sel).first().text().trim(),
          "invalid number",
          ".. and it's displaying the invalid number message")
  t.end()
}

const tests_main = function (t) {
  t.test("only numeric inputs to phone number",
         make_test(test_numeric_input_only))
  t.test("store states on successful call",
         make_test(test_call_success_store_states))
  t.test("store states on invalid number",
         make_test(test_call_invalid_number_store_states))
  t.test("ui behavior while phone is ringing",
         make_test(test_ui_ringing))
  t.test("ui behavior while call connected",
         make_test(test_ui_connected))
  t.test("store states on successful hangup",
         make_test(test_hangup_success_store_states))
  t.test("ui behavior on successful hangup",
         make_test(test_ui_hangup))
  t.test("ui on invalid number",
         make_test(test_ui_invalid_number))

  t.test("store states on successful call listener setup",
         make_test(test_listen_success_store_states))
  t.test("ui behavior while setting up call listener",
         make_test(test_ui_getting_listener))
  t.test("ui behavior while listening for calls",
         make_test(test_ui_listening))
  t.test("store states on close call listener click",
         make_test(test_close_success_store_states))
  t.test("store states on incoming call",
         make_test(test_incoming_call_store_states))
  t.test("ui behavior on incoming call",
         make_test(test_ui_incoming_call))
  t.end()
}

var exports = tests_main

module.exports = exports
