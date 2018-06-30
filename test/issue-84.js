"use strict";

// https://github.com/isaacs/sax-js/issues/49
require(".").test({
  xml: "<?has unbalanced \"quotes?><xml>body</xml>",
  expect: [
    ["processinginstruction", { name: "has", body: "unbalanced \"quotes" }],
    ["opentagstart", { name: "xml", attributes: {} }],
    ["opentag", { name: "xml", attributes: {}, isSelfClosing: false }],
    ["text", "body"],
    ["closetag", "xml"],
  ],
  opt: { lowercasetags: true, noscript: true },
});
