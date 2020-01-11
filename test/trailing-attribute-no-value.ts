import { test } from "./testutil";

test({
  name: "trailing attribute without value",
  xml: "<root attrib></root>",
  expect: [
    ["opentagstart", { name: "root", attributes: {} }],
    ["error", "1:13: attribute without value."],
    ["attribute", { name: "attrib", value: "attrib" }],
    ["opentag",
     { name: "root", attributes: { attrib: "attrib" }, isSelfClosing: false }],
    ["closetag",
     { name: "root", attributes: { attrib: "attrib" }, isSelfClosing: false }],
  ],
  opt: {},
});
