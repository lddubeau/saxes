require(__dirname).test({
  expect: [
    ['opentagstart', {'name': 'r', 'attributes': {}}],
    ['opentag', {'name': 'r', 'attributes': {}, 'isSelfClosing': false}],
    ['opencdata', undefined],
    ['cdata', ' this is '],
    ['closecdata', undefined],
    ['opencdata', undefined],
    ['cdata', 'character data  '],
    ['closecdata', undefined],
    ['closetag', 'r']
  ]
}).write('<r><![CDATA[ this is ]]>').write('<![CDA').write('T').write('A[')
  .write('character data  ').write(']]></r>').close()
