import { test } from "./testutil";

test({
  name: "entity NaN",
  xml: "<r>&#NaN;</r>",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["error", "1:9: malformed character entity."],
    ["text", "&#NaN;"],
    ["closetag", { name: "r", attributes: {}, isSelfClosing: false }],
  ],
});
