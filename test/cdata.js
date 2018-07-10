"use strict";

require(".").test({
  name: "cdata",
  xml: "<r><![CDATA[ this is character data  ]]><![CDATA[]]></r>",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["cdata", " this is character data  "],
    ["cdata", ""],
    ["closetag", "r"],
  ],
});
