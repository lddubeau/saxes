import { test } from "./testutil";

test({
  name: "duplicate attribute",
  xml: "<span id=\"hello\" id=\"there\"></span>",
  expect: [
    ["opentagstart", {
      name: "span",
      attributes: {},
    }],
    ["attribute", { name: "id", value: "hello" }],
    ["attribute", { name: "id", value: "there" }],
    ["error", "1:28: duplicate attribute: id."],
    ["opentag", {
      name: "span",
      attributes: { id: "there" },
      isSelfClosing: false,
    }],
    ["closetag", {
      name: "span",
      attributes: { id: "there" },
      isSelfClosing: false,
    }],
  ],
  opt: {},
});
