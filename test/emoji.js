// split high-order numeric attributes into surrogate pairs
require(__dirname).test({
  xml: '<a>&#x1f525;</a>',
  expect: [
    [ 'opentagstart', { name: 'a', attributes: {} } ],
    [ 'opentag', { name: 'a', attributes: {}, isSelfClosing: false } ],
    [ 'text', '\ud83d\udd25' ],
    [ 'closetag', 'a' ]
  ],
  opt: {}
})
