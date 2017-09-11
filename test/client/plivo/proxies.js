const proxyquire = require('proxyquire').noPreserveCache()
const NodeWebSocketInterface = require('jssip-node-websocket')

const {
  path_app_src: path_app_src,
} = require('../util')

const jssip__nodews = proxyquire('jssip', {
  './WebSocketInterface': NodeWebSocketInterface,
})

const sip_wrap__nodews = proxyquire(
  path_app_src + '/plivo/sip_wrap', {
    'jssip': jssip__nodews,
  })

const plivo__nodews = proxyquire(path_app_src + '/plivo', {
  'jssip': jssip__nodews,
  './sip_wrap': sip_wrap__nodews,
})

var exports = {}

exports.sip_wrap__nodews = sip_wrap__nodews
exports.plivo__nodews = plivo__nodews

module.exports = exports
