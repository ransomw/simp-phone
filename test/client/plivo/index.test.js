const tape = require('blue-tape')
const proxyquire = require('proxyquire').noPreserveCache()

const path_app_src = require('../util').path_app_src

tape.test("app interface to plivo", proxyquire('./index', {
  [path_app_src + '/plivo']: require('./proxies').plivo__nodews,
}))
