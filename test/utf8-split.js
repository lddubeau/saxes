var tap = require('tap')
var saxesStream = require('../lib/saxes').createStream()

var b = new Buffer('误')

saxesStream.on('text', function (text) {
  tap.equal(text, b.toString())
})

saxesStream.write(new Buffer('<test><a>'))
saxesStream.write(b.slice(0, 1))
saxesStream.write(b.slice(1))
saxesStream.write(new Buffer('</a><b>'))
saxesStream.write(b.slice(0, 2))
saxesStream.write(b.slice(2))
saxesStream.write(new Buffer('</b><c>'))
saxesStream.write(b)
saxesStream.write(new Buffer('</c>'))
saxesStream.write(Buffer.concat([new Buffer('<d>'), b.slice(0, 1)]))
saxesStream.end(Buffer.concat([b.slice(1), new Buffer('</d></test>')]))

var saxesStream2 = require('../lib/saxes').createStream()

saxesStream2.on('text', function (text) {
  tap.equal(text, '�')
})

saxesStream2.write(new Buffer('<root>'))
saxesStream2.write(new Buffer('<e>'))
saxesStream2.write(new Buffer([0xC0]))
saxesStream2.write(new Buffer('</e>'))
saxesStream2.write(Buffer.concat([new Buffer('<f>'), b.slice(0, 1)]))
saxesStream2.write(new Buffer('</f></root>'))
saxesStream2.end()
