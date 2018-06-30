require(__dirname).test({
  xml: '<r>&rfloor; ' +
    '&spades; &copy; &rarr; &amp; ' +
    '&lt; &gt; > &real; &weierp; &euro;</r>',
  expect: [
    ['opentagstart', {'name': 'r', attributes: {}}],
    ['opentag', {'name': 'r', attributes: {}, isSelfClosing: false}],
    ['text', '⌋ ♠ © → & < > > ℜ ℘ €'],
    ['closetag', 'r']
  ]
})
