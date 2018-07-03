"use strict";

require(".").test({
  name: "cdata chunked",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["opencdata", undefined],
    ["cdata", " this is character data  "],
    ["closecdata", undefined],
    ["closetag", "r"],
  ],
  fn(parser) {
    parser.write("<r><![CDATA[ this is ").write("character data  ")
      .write("]]></r>")
      .close();
  },
});
