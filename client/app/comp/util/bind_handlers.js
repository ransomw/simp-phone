const R = require('ramda')

const bind_handlers = function (clazz, handler_regexp) {
  R.compose(
    R.forEach(R.apply((key, val) => {
      clazz[key] = val.bind(clazz)
    })),
    R.filter(R.apply((_, val) => typeof val === 'function')),
    R.map(R.juxt([R.identity, R.prop(R.__, clazz)])),
    R.filter((key) => key !== 'constructor'),
    R.filter((key) => handler_regexp === null ||
             key.match(handler_regexp) !== null)
  )(Object.getOwnPropertyNames(clazz.constructor.prototype))
}

var exports = bind_handlers

module.exports = exports
