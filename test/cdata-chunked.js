require(__dirname).test({
  expect: [
    ['opentagstart', {'name': 'r', 'attributes': {}}],
    ['opentag', {'name': 'r', 'attributes': {}, 'isSelfClosing': false}],
    ['opencdata', undefined],
    ['cdata', ' this is character data  '],
    ['closecdata', undefined],
    ['closetag', 'r']
  ]
}).write('<r><![CDATA[ this is ').write('character data  ').write(']]></r>').close()
