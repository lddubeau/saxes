"use strict";

require(".").test({
  name: "trailing non-whitespace text",
  xml: "<span>Welcome,</span> to monkey land",
  expect: [
    ["opentagstart", {
      name: "span",
      attributes: {},
    }],
    ["opentag", {
      name: "span",
      attributes: {},
      isSelfClosing: false,
    }],
    ["text", "Welcome,"],
    ["closetag", "span"],
    ["text", " "],
    ["error", "undefined:1:23: text data outside of root node."],
    ["text", "to monkey land"],
    ["end", undefined],
    ["ready", undefined],
  ],
  opt: {},
});
