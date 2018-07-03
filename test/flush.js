"use strict";

require(".").test({
  name: "flush",
  expect: [
    ["opentagstart", { name: "T", attributes: {} }],
    ["opentag", { name: "T", attributes: {}, isSelfClosing: false }],
    ["text", "flush"],
    ["text", "rest"],
    ["closetag", "T"],
  ],
  fn(parser) {
    parser.write("<T>flush")
      .flush()
      .write("rest</T>")
      .close();
  },
});
