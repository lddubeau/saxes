"use strict";

require(".").test({
  name: "cadat end split",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["opencdata", undefined],
    ["cdata", " this is "],
    ["closecdata", undefined],
    ["closetag", "r"],
  ],
  fn(parser) {
    parser.write("<r><![CDATA[ this is ]")
      .write("]>")
      .write("</r>")
      .close();
  },
});
