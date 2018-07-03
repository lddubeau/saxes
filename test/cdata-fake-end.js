"use strict";

require(".").test({
  name: "cdata fake end",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["opencdata", undefined],
    ["cdata", "[[[[[[[[]]]]]]]]"],
    ["closecdata", undefined],
    ["closetag", "r"],
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
    ["opencdata", undefined],
    ["cdata", "[[[[[[[[]]]]]]]]"],
    ["closecdata", undefined],
    ["closetag", "r"],
  ],
  xml: "<r><![CDATA[[[[[[[[[]]]]]]]]]]></r>",
});
