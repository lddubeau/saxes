"use strict";

require(".").test({
  xml: "<span id=\"hello\" id=\"there\"></span>",
  expect: [
    ["opentagstart", {
      name: "span",
      attributes: {},
    }],
    ["attribute", { name: "id", value: "hello" }],
    ["opentag", {
      name: "span",
      attributes: { id: "hello" },
      isSelfClosing: false,
    }],
    ["closetag", "span"],
  ],
  opt: {},
});
