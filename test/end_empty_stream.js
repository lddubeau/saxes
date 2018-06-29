var tap = require('tap')
var saxesStream = require('../lib/saxes').createStream()
tap.doesNotThrow(function () {
  saxesStream.end()
})
