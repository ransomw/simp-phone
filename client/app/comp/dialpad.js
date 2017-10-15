const R = require('ramda')
const createElement = require('react').createElement

const add_idxs = R.compose(R.apply(R.zip), R.juxt([
  R.identity,
  R.compose(R.range(0), R.length),
]))

const lots_a_things = ((athing) => {return R.compose(
  R.map(R.apply(
    (fn, idx) => { return fn(idx) }
  )),
  add_idxs,
  R.liftN(1, athing)
)})

const button = R.curry(R.nAry(3, function (cb, text, key) {
  return createElement(
    'button',
    {onClick: () => cb(text),
     key: key,
    },
    text
  )
}))

const div_o_many = R.curryN(3, function (key, athing, infos) {
  return createElement(
    'div', {key: key},
    lots_a_things(athing)(infos)
  )
})

const a_row = R.curryN(3, function (cb, labels, key) {
  return R.compose(div_o_many(key),
                   button)(cb)(labels)
})

const dialpad = function (cb) {
  return createElement(
    'div', {},
    R.compose(
      R.map(R.apply(
        a_row(cb)
      )),
      R.compose(add_idxs, R.splitEvery(3))
    )(R.concat(R.range(1, 10), ['*', 0, '#']))
  )
}

var exports = dialpad

module.exports = exports
