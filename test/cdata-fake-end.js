"use strict";

require(".").test({
  name: "cdata fake end",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["cdata", "[[[[[[[[]]]]]]]]"],
    ["closetag", { name: "r", attributes: {}, isSelfClosing: false }],
  ],
  fn(parser) {
    const x = "<r><![CDATA[[[[[[[[[]]]]]]]]]]></r>";
    for (let i = 0; i < x.length; i++) {
      parser.write(x.charAt(i));
    }
    parser.close();
  },
});

require(".").test({
  name: "cdata fake end 2",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["cdata", "[[[[[[[[]]]]]]]]"],
    ["closetag", { name: "r", attributes: {}, isSelfClosing: false }],
  ],
  xml: "<r><![CDATA[[[[[[[[[]]]]]]]]]]></r>",
});
