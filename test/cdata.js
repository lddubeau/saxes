"use strict";

require(".").test({
  name: "cdata",
  xml: "<r><![CDATA[ this is character data  ]]></r>",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["cdata", " this is character data  "],
    ["closetag", "r"],
  ],
});
