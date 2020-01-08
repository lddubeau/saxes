import { test } from "./testutil";

test({
  name: "comment",
  xml: "<r><!--foo--><!----></r>",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["comment", "foo"],
    ["comment", ""],
    ["closetag", { name: "r", attributes: {}, isSelfClosing: false }],
  ],
});
