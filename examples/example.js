var fs = require('fs'),
  util = require('util'),
  path = require('path'),
  xml = fs.readFileSync(path.join(__dirname, 'test.xml'), 'utf8'),
  saxes = require('../lib/saxes'),
  parser = saxes.parser(),
  inspector = function (ev) { return function (data) {
    console.error('%s %s %j', this.line + ':' + this.column, ev, data)
    if (ev === "error") {
      parser.resume()
    }
  }}

saxes.EVENTS.forEach(function (ev) {
  parser['on' + ev] = inspector(ev)
})
parser.onend = function () {
  console.error('end')
  console.error(parser)
}

// do this in random bits at a time to verify that it works.
(function () {
  if (xml) {
    var c = Math.ceil(Math.random() * 1000)
    parser.write(xml.substr(0, c))
    xml = xml.substr(c)
    process.nextTick(arguments.callee)
  } else parser.close()
}())
