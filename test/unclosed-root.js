"use strict";

require(".").test({
  name: "unclosed root",
  xml: "<root>",
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
      "error",
      "undefined:1:6: unclosed tag: root",
    ],
  ],
  opt: {},
});
