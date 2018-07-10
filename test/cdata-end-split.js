"use strict";

require(".").test({
  name: "cadat end split",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["cdata", " this is "],
    ["closetag", "r"],
  ],
  fn(parser) {
    parser.write("<r><![CDATA[ this is ]")
      .write("]>")
      .write("</r>")
      .close();
  },
});
