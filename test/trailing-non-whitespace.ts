import { test } from "./testutil";

test({
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
    ["closetag", {
      name: "span",
      attributes: {},
      isSelfClosing: false,
    }],
    ["error", "1:36: text data outside of root node."],
    ["text", " to monkey land"],
    ["end", undefined],
    ["ready", undefined],
  ],
  opt: {},
});
