"use strict";

require(".").test({
  xml: "<root attrib></root>",
  expect: [
    ["opentagstart", { name: "root", attributes: {} }],
    ["error", "Attribute without value\n\
Line: 0\n\
Column: 13\n\
Char: >"],
    ["attribute", { name: "attrib", value: "attrib" }],
    ["opentag", { name: "root", attributes: { attrib: "attrib" }, isSelfClosing: false }],
    ["closetag", "root"],
  ],
  opt: {},
});
