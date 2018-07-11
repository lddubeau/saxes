"use strict";

require(".").test({
  name: "cdata multiple",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["cdata", " this is "],
    ["cdata", "character data  "],
    ["closetag", { name: "r", attributes: {}, isSelfClosing: false }],
  ],
  fn(parser) {
    parser.write("<r><![CDATA[ this is ]]>").write("<![CDA")
      .write("T")
      .write("A[")
      .write("character data  ")
      .write("]]></r>")
      .close();
  },
});
