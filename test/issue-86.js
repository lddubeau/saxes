"use strict";

require(".").test({
  name: "issue 86 (prevent open waka after root has closed)",
  xml: "<root>abc</root>de<f",
  expect: [
    [
      "opentagstart",
      {
        name: "root",
        attributes: {},
      },
    ],
    [
      "opentag",
      {
        name: "root",
        attributes: {},
        isSelfClosing: false,
      },
    ],
    [
      "text",
      "abc",
    ],
    [
      "closetag",
      {
        name: "root",
        attributes: {},
        isSelfClosing: false,
      },
    ],
    [
      "error",
      "undefined:1:19: text data outside of root node.",
    ],
    [
      "text",
      "de",
    ],
    [
      "error",
      "undefined:1:20: unexpected end.",
    ],
  ],
  opt: {},
});
