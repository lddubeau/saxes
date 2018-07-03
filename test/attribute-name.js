"use strict";

require(".").test({
  name: "attribute name",
  xml: "<root length='12345'></root>",
  expect: [
    ["opentagstart", { name: "root", attributes: {}, ns: {} }],
    [
      "attribute",
      {
        name: "length",
        value: "12345",
        prefix: "",
        local: "length",
        uri: "",
      },
    ],
    [
      "opentag",
      {
        name: "root",
        prefix: "",
        local: "root",
        uri: "",
        attributes: {
          length: {
            name: "length",
            value: "12345",
            prefix: "",
            local: "length",
            uri: "",
          },
        },
        ns: {},
        isSelfClosing: false,
      },
    ],
    [
      "closetag",
      "root",
    ],
  ],
  opt: {
    xmlns: true,
  },
});
