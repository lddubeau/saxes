"use strict";

require(".").test({
  xml: "<r>&amp; &lt; &gt; ></r>",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["text", "& < > >"],
    ["closetag", "r"],
  ],
});
