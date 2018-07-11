"use strict";

require(".").test({
  name: "entity NaN",
  xml: "<r>&#NaN;</r>",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["error", "undefined:1:9: malformed character entity."],
    ["text", "&#NaN;"],
    ["closetag", { name: "r", attributes: {}, isSelfClosing: false }],
  ],
});
