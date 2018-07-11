"use strict";

require(".").test({
  name: "entities",
  xml: "<r>&amp; &lt; &gt; ></r>",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["text", "& < > >"],
    ["closetag", { name: "r", attributes: {}, isSelfClosing: false }],
  ],
});
