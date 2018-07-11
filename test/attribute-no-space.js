"use strict";

// should give an error, but still parse
require(".").test({
  name: "attributes without a space",
  xml: "<root attr1=\"first\"attr2=\"second\"/>",
  expect: [
    ["opentagstart", { name: "root", attributes: {} }],
    ["error", "undefined:1:20: no whitespace between attributes."],
    ["opentag", { name: "root", attributes: { attr1: "first", attr2: "second" }, isSelfClosing: true }],
    ["closetag", { name: "root", attributes: { attr1: "first", attr2: "second" }, isSelfClosing: true }],
  ],
  opt: { },
});

// other cases should still pass
require(".").test({
  name: "attributes separated by a space",
  xml: "<root attr1=\"first\" attr2=\"second\"/>",
  expect: [
    ["opentagstart", { name: "root", attributes: {} }],
    ["opentag", { name: "root", attributes: { attr1: "first", attr2: "second" }, isSelfClosing: true }],
    ["closetag", { name: "root", attributes: { attr1: "first", attr2: "second" }, isSelfClosing: true }],
  ],
  opt: { },
});

// other cases should still pass
require(".").test({
  name: "attributes separated by a newline",
  xml: "<root attr1=\"first\"\nattr2=\"second\"/>",
  expect: [
    ["opentagstart", { name: "root", attributes: {} }],
    ["opentag", { name: "root", attributes: { attr1: "first", attr2: "second" }, isSelfClosing: true }],
    ["closetag", { name: "root", attributes: { attr1: "first", attr2: "second" }, isSelfClosing: true }],
  ],
  opt: { },
});

// other cases should still pass
require(".").test({
  name: "attributes separated by spaces",
  xml: "<root attr1=\"first\"  attr2=\"second\"/>",
  expect: [
    ["opentagstart", { name: "root", attributes: {} }],
    ["opentag", { name: "root", attributes: { attr1: "first", attr2: "second" }, isSelfClosing: true }],
    ["closetag", { name: "root", attributes: { attr1: "first", attr2: "second" }, isSelfClosing: true }],
  ],
  opt: { },
});
