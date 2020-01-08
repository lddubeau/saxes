import { test } from "./testutil";

// https://github.com/isaacs/sax-js/issues/84
test({
  name: "issue 84 (unbalanced quotes in pi)",
  xml: "<xml><?has unbalanced \"quotes?>body</xml>",
  expect: [
    ["opentagstart", { name: "xml", attributes: {} }],
    ["opentag", { name: "xml", attributes: {}, isSelfClosing: false }],
    ["processinginstruction", { target: "has", body: "unbalanced \"quotes" }],
    ["text", "body"],
    ["closetag", { name: "xml", attributes: {}, isSelfClosing: false }],
  ],
  opt: {},
});
