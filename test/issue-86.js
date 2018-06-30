"use strict";

require(".").test({
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
      "root",
    ],
    [
      "error",
      "Text data outside of root node.\nLine: 0\nColumn: 17\nChar: d",
    ],
    [
      "text",
      "de",
    ],
    [
      "error",
      "Unexpected end\nLine: 0\nColumn: 20\nChar: ",
    ],
  ],
  opt: {},
});
