/* globals AudioContext */

const increase_media_stream_gain = function (stream, multiplier) {
  const audioCtx = new AudioContext()
  const source = audioCtx.createMediaStreamSource(stream)
  const gainNode = audioCtx.createGain()
  gainNode.gain.value = multiplier
  source.connect(gainNode)
  gainNode.connect(audioCtx.destination)
}

var exports = {}

exports.increase_media_stream_gain = increase_media_stream_gain

module.exports = exports
