import { test } from "./testutil";

// BOM at the very begining of the stream should be ignored
test({
  name: "BOM at start",
  xml: "\uFEFF<P></P>",
  expect: [
    ["opentagstart", { name: "P", attributes: {} }],
    ["opentag", { name: "P", attributes: {}, isSelfClosing: false }],
    ["closetag", { name: "P", attributes: {}, isSelfClosing: false }],
  ],
});

// In all other places it should be consumed
test({
  name: "BOM in contents",
  xml: "\uFEFF<P BOM=\"\uFEFF\">\uFEFFStarts and ends with BOM\uFEFF</P>",
  expect: [
    ["opentagstart", { name: "P", attributes: {} }],
    ["attribute", { name: "BOM", value: "\uFEFF" }],
    ["opentag", {
      name: "P",
      attributes: { BOM: "\uFEFF" },
      isSelfClosing: false,
    }],
    ["text", "\uFEFFStarts and ends with BOM\uFEFF"],
    ["closetag", {
      name: "P",
      attributes: { BOM: "\uFEFF" },
      isSelfClosing: false,
    }],
  ],
});

// BOM after a whitespace is an error
test({
  name: "BOM outside of root, but not initial",
  xml: " \uFEFF<P></P>",
  expect: [
    ["text", "\uFEFF"],
    ["error", "1:3: text data outside of root node."],
    ["opentagstart", { name: "P", attributes: {} }],
    ["opentag", { name: "P", attributes: {}, isSelfClosing: false }],
    ["closetag", { name: "P", attributes: {}, isSelfClosing: false }],
  ],
});

// There is only one BOM allowed at the start
test({
  name: "multiple BOMs",
  xml: "\uFEFF\uFEFF<P></P>",
  expect: [
    ["text", "\uFEFF"],
    ["error", "1:3: text data outside of root node."],
    ["opentagstart", { name: "P", attributes: {} }],
    ["opentag", { name: "P", attributes: {}, isSelfClosing: false }],
    ["closetag", { name: "P", attributes: {}, isSelfClosing: false }],
  ],
});

// There is only one BOM allowed at the start
test({
  name: "multiple BOMs (multiple chunks)",
  xml: ["\uFEFF", "\uFEFF<P></P>"],
  expect: [
    ["text", "\uFEFF"],
    ["error", "1:3: text data outside of root node."],
    ["opentagstart", { name: "P", attributes: {} }],
    ["opentag", { name: "P", attributes: {}, isSelfClosing: false }],
    ["closetag", { name: "P", attributes: {}, isSelfClosing: false }],
  ],
});
