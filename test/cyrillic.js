"use strict";

require(".").test({
  name: "cyrillic",
  xml: "<Р>тест</Р>",
  expect: [
    ["opentagstart", { name: "Р", attributes: {} }],
    ["opentag", { name: "Р", attributes: {}, isSelfClosing: false }],
    ["text", "тест"],
    ["closetag", { name: "Р", attributes: {}, isSelfClosing: false }],
  ],
});
