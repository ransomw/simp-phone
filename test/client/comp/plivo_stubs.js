const simple = require('simple-mock')

var exports = {
  check_sip_creds: simple.stub().returnWith(true)
}

module.exports = exports
