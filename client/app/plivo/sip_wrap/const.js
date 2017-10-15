const I = require('immutable')

const _plivo_conf = require('../plivo_conf.json')

const PLIVIO_SIP_WS_URL = _plivo_conf.PLIVIO_SIP_WS_URL
const CALL_OPTS = I.fromJS(_plivo_conf.CALL_OPTS)
const timeouts = I.Map(_plivo_conf.timeouts)

const PHONE_REGEXP = new RegExp('^[0-9]{7}[0-9]*$')

var exports = {}

exports.PLIVIO_SIP_WS_URL = PLIVIO_SIP_WS_URL
exports.CALL_OPTS = CALL_OPTS
exports.timeouts = timeouts
exports.PHONE_REGEXP = PHONE_REGEXP

module.exports = exports
