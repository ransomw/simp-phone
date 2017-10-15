const I = require('immutable')

const err_codes = I.Map({
  auth: 1,
  timeout: 2,
})

var exports = {}

exports.err_codes = err_codes

module.exports = exports
