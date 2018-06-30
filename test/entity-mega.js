var saxes = require('../')
var xml = '<r>'
var text = ''
for (var i in saxes.ENTITIES) {
  xml += '&' + i + ';'
  text += saxes.ENTITIES[i]
}
xml += '</r>'
require(__dirname).test({
  xml: xml,
  expect: [
    ['opentagstart', {'name': 'r', attributes: {}}],
    ['opentag', {'name': 'r', attributes: {}, isSelfClosing: false}],
    ['text', text],
    ['closetag', 'r']
  ]
})
