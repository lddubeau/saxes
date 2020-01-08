import { test } from "./testutil";

// https://github.com/isaacs/sax-js/issues/35
test({
  name: "issue 35 (leading 0 in entity numeric code)",
  xml: "<xml>&#xd;&#x0d;\n</xml>",
  expect: [
    ["opentagstart", { name: "xml", attributes: {} }],
    ["opentag", { name: "xml", attributes: {}, isSelfClosing: false }],
    ["text", "\r\r\n"],
    ["closetag", { name: "xml", attributes: {}, isSelfClosing: false }],
  ],
  opt: {},
});
