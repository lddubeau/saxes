"use strict";

require(".").test({
  name: "empty entity",
  xml: "<r>&;</r>",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["error", "Invalid character entity\nLine: 0\nColumn: 5\nChar: ;"],
    ["text", "&;"],
    ["closetag", "r"],
  ],
});

require(".").test({
  name: "empty decimal entity",
  xml: "<r>&#;</r>",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["error", "Invalid character entity\nLine: 0\nColumn: 6\nChar: ;"],
    ["text", "&#;"],
    ["closetag", "r"],
  ],
});

require(".").test({
  name: "empty hex entity",
  xml: "<r>&#x;</r>",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["error", "Invalid character entity\nLine: 0\nColumn: 7\nChar: ;"],
    ["text", "&#x;"],
    ["closetag", "r"],
  ],
});
