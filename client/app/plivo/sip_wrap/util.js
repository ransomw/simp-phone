const R = require('ramda')

/**
 * ev_fns -- {on:(String, fn), emit:(String, Object)}
 * ev_names -- [String]
 * opt_args -- {omit:[String]}
 */
const bubble_events = function (ev_fns, ev_names, opt_args) {
  const opts = opt_args || {}
  opts.omit = opts.omit || []
  // ... functional style allows declarative lists
  R.forEach(R.compose(
    R.curry(R.apply)(
      ev_fns.on
    ),
    R.juxt([
      R.identity,
      (ev_name) => {
        return R.compose(
          R.curry(ev_fns.emit)(
            opts.prefix ? [opts.prefix, ev_name].join(':') : ev_name
          ),
          R.partial(R.omit, opts.omit))
      }])
  ), ev_names)
}

const make_timeout_promise_cb = function (ms, orig_cb) {
  return function (resolve, reject) {
    // console.log("top of timeout promise callback")
    const timeout = setTimeout(function () {
      const err = new Error("timeout")
      err.name = 'timeout'
      reject(err)
    }, ms)
    const updated_resolve = function () {
      clearTimeout(timeout)
      resolve.apply(this, arguments)
    }
    R.nAry(2, orig_cb)(updated_resolve, reject)
  }
}

var exports = {}

exports.bubble_events = bubble_events
exports.make_timeout_promise_cb = make_timeout_promise_cb

module.exports = exports
