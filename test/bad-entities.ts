import { test } from "./testutil";

test({
  name: "empty entity",
  xml: "<r>&;</r>",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["error", "1:5: empty entity name."],
    ["text", "&;"],
    ["closetag", { name: "r", attributes: {}, isSelfClosing: false }],
  ],
});

test({
  name: "empty decimal entity",
  xml: "<r>&#;</r>",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["error", "1:6: malformed character entity."],
    ["text", "&#;"],
    ["closetag", { name: "r", attributes: {}, isSelfClosing: false }],
  ],
});

test({
  name: "empty hex entity",
  xml: "<r>&#x;</r>",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["error", "1:7: malformed character entity."],
    ["text", "&#x;"],
    ["closetag", { name: "r", attributes: {}, isSelfClosing: false }],
  ],
});
