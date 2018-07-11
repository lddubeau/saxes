"use strict";

require(".").test({
  name: "empty entity",
  xml: "<r>&;</r>",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["error", "undefined:1:5: malformed character entity."],
    ["text", "&;"],
    ["closetag", { name: "r", attributes: {}, isSelfClosing: false }],
  ],
});

require(".").test({
  name: "empty decimal entity",
  xml: "<r>&#;</r>",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["error", "undefined:1:6: malformed character entity."],
    ["text", "&#;"],
    ["closetag", { name: "r", attributes: {}, isSelfClosing: false }],
  ],
});

require(".").test({
  name: "empty hex entity",
  xml: "<r>&#x;</r>",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["error", "undefined:1:7: malformed character entity."],
    ["text", "&#x;"],
    ["closetag", { name: "r", attributes: {}, isSelfClosing: false }],
  ],
});
