"use strict";

require(".").test({
  name: "cdata chunked",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["cdata", " this is character data  "],
    ["closetag", "r"],
  ],
  fn(parser) {
    parser.write("<r><![CDATA[ this is ").write("character data  ")
      .write("]]></r>")
      .close();
  },
});
