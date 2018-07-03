"use strict";

require(".").test({
  name: "entity NaN",
  xml: "<r>&#NaN;</r>",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["error", "Invalid character entity\n\
Line: 0\n\
Column: 9\n\
Char: ;"],
    ["text", "&#NaN;"],
    ["closetag", "r"],
  ],
});
