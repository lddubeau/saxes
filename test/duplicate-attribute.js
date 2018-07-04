"use strict";

require(".").test({
  name: "duplicate attribute",
  xml: "<span id=\"hello\" id=\"there\"></span>",
  expect: [
    ["opentagstart", {
      name: "span",
      attributes: {},
    }],
    ["attribute", { name: "id", value: "hello" }],
    ["error", "Duplicate attribute: id.\nLine: 0\nColumn: 28\nChar: >"],
    ["attribute", { name: "id", value: "there" }],
    ["opentag", {
      name: "span",
      attributes: { id: "there" },
      isSelfClosing: false,
    }],
    ["closetag", "span"],
  ],
  opt: {},
});
