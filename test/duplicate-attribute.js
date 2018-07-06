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
    ["error", "undefined:1:28: duplicate attribute: id."],
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
