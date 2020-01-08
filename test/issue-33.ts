import { test } from "./testutil";

// https://github.com/isaacs/sax-js/issues/33
test({
  name: "issue 33 (comment with single dash)",
  xml: "<xml>\n" +
    "<!-- \n" +
    "  comment with a single dash- in it\n" +
    "-->\n" +
    "<data/>\n" +
    "</xml>",
  expect: [
    ["opentagstart", { name: "xml", attributes: {} }],
    ["opentag", { name: "xml", attributes: {}, isSelfClosing: false }],
    ["text", "\n"],
    ["comment", " \n  comment with a single dash- in it\n"],
    ["text", "\n"],
    ["opentagstart", { name: "data", attributes: {} }],
    ["opentag", { name: "data", attributes: {}, isSelfClosing: true }],
    ["closetag", { name: "data", attributes: {}, isSelfClosing: true }],
    ["text", "\n"],
    ["closetag", { name: "xml", attributes: {}, isSelfClosing: false }],
  ],
  opt: {},
});
