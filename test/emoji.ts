import { test } from "./testutil";

// split high-order numeric attributes into surrogate pairs
test({
  name: "emoji",
  xml: "<a>&#x1f525;</a>",
  expect: [
    ["opentagstart", { name: "a", attributes: {} }],
    ["opentag", { name: "a", attributes: {}, isSelfClosing: false }],
    ["text", "\ud83d\udd25"],
    ["closetag", { name: "a", attributes: {}, isSelfClosing: false }],
  ],
  opt: {},
});
