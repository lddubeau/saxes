require(__dirname).test({
  expect: [
    [ 'opentagstart', { name: 'root', attributes: {}, ns: {} } ],
    [ 'error', "Unquoted attribute value\n\
Line: 0\n\
Column: 14\n\
Char: 1" ],
    [ 'attribute', {
      name: 'length',
      value: '12345',
      prefix: '',
      local: 'length',
      uri: ''
    }],
    [ 'opentag', {
      name: 'root',
      attributes: {
        length: {
          name: 'length',
          value: '12345',
          prefix: '',
          local: 'length',
          uri: ''
        }
      },
      ns: {},
      prefix: '',
      local: 'root',
      uri: '',
      isSelfClosing: false
    } ],
    [ 'closetag', 'root' ],
    [ 'end' ],
    [ 'ready' ]
  ],
  opt: {
    xmlns: true
  }
}).write('<root length=12').write('345></root>').close()
