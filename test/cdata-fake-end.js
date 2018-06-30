var p = require(__dirname).test({
  expect: [
    ['opentagstart', {'name': 'r', 'attributes': {}}],
    ['opentag', {'name': 'r', 'attributes': {}, 'isSelfClosing': false}],
    ['opencdata', undefined],
    ['cdata', '[[[[[[[[]]]]]]]]'],
    ['closecdata', undefined],
    ['closetag', 'r']
  ]
})
var x = '<r><![CDATA[[[[[[[[[]]]]]]]]]]></r>'
for (var i = 0; i < x.length; i++) {
  p.write(x.charAt(i))
}
p.close()

var p2 = require(__dirname).test({
  expect: [
    ['opentagstart', {'name': 'r', 'attributes': {}}],
    ['opentag', {'name': 'r', 'attributes': {}, 'isSelfClosing': false}],
    ['opencdata', undefined],
    ['cdata', '[[[[[[[[]]]]]]]]'],
    ['closecdata', undefined],
    ['closetag', 'r']
  ]
})
x = '<r><![CDATA[[[[[[[[[]]]]]]]]]]></r>'
p2.write(x).close()
