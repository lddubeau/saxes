"use strict";

require(".").test({
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
    ["error", "Text data outside of root node.\n\
Line: 0\n\
Column: 23\n\
Char: t"],
    ["text", "to monkey land"],
    ["end"],
    ["ready"],
  ],
  opt: {},
});
