#! /usr/bin/env node

const test = require('../test/client')

Promise.resolve().then(function () {
  return test.run_tests()
}).catch(function (err) {
  console.log("test error:\n" + err.toString())
})
