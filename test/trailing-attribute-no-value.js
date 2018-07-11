"use strict";

require(".").test({
  name: "trailing attribute without value",
  xml: "<root attrib></root>",
  expect: [
    ["opentagstart", { name: "root", attributes: {} }],
    ["error", "undefined:1:13: attribute without value."],
    ["opentag", { name: "root", attributes: { attrib: "attrib" }, isSelfClosing: false }],
    ["closetag", { name: "root", attributes: { attrib: "attrib" }, isSelfClosing: false }],
  ],
  opt: {},
});
