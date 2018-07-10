"use strict";

// BOM at the very begining of the stream should be ignored
require(".").test({
  name: "BOM at start",
  xml: "\uFEFF<P></P>",
  expect: [
    ["opentagstart", { name: "P", attributes: {} }],
    ["opentag", { name: "P", attributes: {}, isSelfClosing: false }],
    ["closetag", "P"],
  ],
});

// In all other places it should be consumed
require(".").test({
  name: "BOM in contents",
  xml: "\uFEFF<P BOM=\"\uFEFF\">\uFEFFStarts and ends with BOM\uFEFF</P>",
  expect: [
    ["opentagstart", { name: "P", attributes: {} }],
    ["opentag", { name: "P", attributes: { BOM: "\uFEFF" }, isSelfClosing: false }],
    ["text", "\uFEFFStarts and ends with BOM\uFEFF"],
    ["closetag", "P"],
  ],
});

// BOM after a whitespace is an error
require(".").test({
  name: "BOM outside of root, but not initial",
  xml: " \uFEFF<P></P>",
  expect: [
    ["error", "undefined:1:2: text data outside of root node."],
    ["text", "\uFEFF"],
    ["opentagstart", { name: "P", attributes: {} }],
    ["opentag", { name: "P", attributes: {}, isSelfClosing: false }],
    ["closetag", "P"],
  ],
});

// There is only one BOM allowed at the start
require(".").test({
  name: "multiple BOMs",
  xml: "\uFEFF\uFEFF<P></P>",
  expect: [
    ["error", "undefined:1:2: text data outside of root node."],
    ["text", "\uFEFF"],
    ["opentagstart", { name: "P", attributes: {} }],
    ["opentag", { name: "P", attributes: {}, isSelfClosing: false }],
    ["closetag", "P"],
  ],
});
