"use strict";

require(".").test({
  xml: "<Р>тест</Р>",
  expect: [
    ["opentagstart", { name: "Р", attributes: {} }],
    ["opentag", { name: "Р", attributes: {}, isSelfClosing: false }],
    ["text", "тест"],
    ["closetag", "Р"],
  ],
});
