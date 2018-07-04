"use strict";

// should give an error, but still parse
require(".").test({
  name: "attributes without a space",
  xml: "<root attr1=\"first\"attr2=\"second\"/>",
  expect: [
    ["opentagstart", { name: "root", attributes: {} }],
    ["error", "No whitespace between attributes\nLine: 0\nColumn: 20\nChar: a"],
    ["attribute", { name: "attr1", value: "first" }],
    ["attribute", { name: "attr2", value: "second" }],
    ["opentag", { name: "root", attributes: { attr1: "first", attr2: "second" }, isSelfClosing: true }],
    ["closetag", "root"],
  ],
  opt: { },
});

// other cases should still pass
require(".").test({
  name: "attributes separated by a space",
  xml: "<root attr1=\"first\" attr2=\"second\"/>",
  expect: [
    ["opentagstart", { name: "root", attributes: {} }],
    ["attribute", { name: "attr1", value: "first" }],
    ["attribute", { name: "attr2", value: "second" }],
    ["opentag", { name: "root", attributes: { attr1: "first", attr2: "second" }, isSelfClosing: true }],
    ["closetag", "root"],
  ],
  opt: { },
});

// other cases should still pass
require(".").test({
  name: "attributes separated by a newline",
  xml: "<root attr1=\"first\"\nattr2=\"second\"/>",
  expect: [
    ["opentagstart", { name: "root", attributes: {} }],
    ["attribute", { name: "attr1", value: "first" }],
    ["attribute", { name: "attr2", value: "second" }],
    ["opentag", { name: "root", attributes: { attr1: "first", attr2: "second" }, isSelfClosing: true }],
    ["closetag", "root"],
  ],
  opt: { },
});

// other cases should still pass
require(".").test({
  name: "attributes separated by spaces",
  xml: "<root attr1=\"first\"  attr2=\"second\"/>",
  expect: [
    ["opentagstart", { name: "root", attributes: {} }],
    ["attribute", { name: "attr1", value: "first" }],
    ["attribute", { name: "attr2", value: "second" }],
    ["opentag", { name: "root", attributes: { attr1: "first", attr2: "second" }, isSelfClosing: true }],
    ["closetag", "root"],
  ],
  opt: { },
});
