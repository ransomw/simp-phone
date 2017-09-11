const tape = require('blue-tape')
const proxyquire = require('proxyquire').noPreserveCache()

const path_app_src = require('../util').path_app_src

tape.test("plivo sip wrap", proxyquire('./sip_wrap', {
  [path_app_src + '/plivo/sip_wrap'
  ]: require('./proxies').sip_wrap__nodews,
}))
