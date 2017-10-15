const WebSocketInterface = require('jssip').WebSocketInterface
const JssipUserAgent = require('jssip').UA

const {
  make_timeout_promise_cb,
} = require('./util')
const {
  PLIVIO_SIP_WS_URL,
  timeouts,
} = require('./const')


const login = function (user, pass) {
  const jssipUserAgent = new JssipUserAgent({
    sockets: [(new WebSocketInterface(PLIVIO_SIP_WS_URL))],
    uri: 'sip:' + user + '@phone.plivo.com',
    password: pass
  })
  return new Promise(make_timeout_promise_cb(
    timeouts.get('login'), (resolve, reject) => {
      jssipUserAgent.on('registered', () => resolve({
        close: jssipUserAgent.stop.bind(jssipUserAgent),
        on: jssipUserAgent.on.bind(jssipUserAgent),
        call: jssipUserAgent.call.bind(jssipUserAgent),
      }))
      jssipUserAgent.on('registrationFailed',
                        (data) => reject(data.cause))
      jssipUserAgent.start()
    })).catch((err) => {
      jssipUserAgent.stop()
      throw err
    })
}

var exports = login

module.exports = exports
