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
