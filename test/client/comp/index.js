const tests_main = function (t) {
  t.test("plivo sip login", require('./plivo_sip_login'))
  t.end()
}

var exports = tests_main

module.exports = exports
