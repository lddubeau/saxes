require(__dirname).test({
  xml: '<root>   ' +
    '<haha /> ' +
    '<haha/>  ' +
    '<monkey> ' +
    '=(|)     ' +
    '</monkey>' +
    '</root>  ',
  expect: [
    ['opentagstart', {name: 'root', attributes: {}}],
    ['opentag', {name: 'root', attributes: {}, isSelfClosing: false}],
    ['opentagstart', {name: 'haha', attributes: {}}],
    ['opentag', {name: 'haha', attributes: {}, isSelfClosing: true}],
    ['closetag', 'haha'],
    ['opentagstart', {name: 'haha', attributes: {}}],
    ['opentag', {name: 'haha', attributes: {}, isSelfClosing: true}],
    ['closetag', 'haha'],
    // ["opentag", {name:"haha", attributes:{}}],
    // ["closetag", "haha"],
    ['opentagstart', {name: 'monkey', attributes: {}}],
    ['opentag', {name: 'monkey', attributes: {}, isSelfClosing: false}],
    ['text', '=(|)'],
    ['closetag', 'monkey'],
    ['closetag', 'root']
  ],
  opt: { trim: true }
})
