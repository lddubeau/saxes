"use strict";

const t = require(".");

const expect = [
  ["opentagstart", { name: "parent", attributes: {}, ns: {} }],
  [
    "opennamespace",
    {
      prefix: "a",
      uri: "http://ATTRIBUTE",
    },
  ],
  [
    "opentag",
    {
      name: "parent",
      uri: "",
      prefix: "",
      local: "parent",
      attributes: {
        "a:attr": {
          name: "a:attr",
          local: "attr",
          prefix: "a",
          uri: "http://ATTRIBUTE",
          value: "value",
        },
        "xmlns:a": {
          name: "xmlns:a",
          local: "a",
          prefix: "xmlns",
          uri: "http://www.w3.org/2000/xmlns/",
          value: "http://ATTRIBUTE",
        },
      },
      ns: {
        a: "http://ATTRIBUTE",
      },
      isSelfClosing: true,
    },
  ],
  [
    "closetag",
    "parent",
  ],
  [
    "closenamespace",
    {
      prefix: "a",
      uri: "http://ATTRIBUTE",
    },
  ],
];

// should be the same both ways.
const xmls = [
  "<parent xmlns:a=\"http://ATTRIBUTE\" a:attr=\"value\" />",
  "<parent a:attr=\"value\" xmlns:a=\"http://ATTRIBUTE\" />",
];
describe("issue 41", () => {
  xmls.forEach((x, i) => {
    t.test({
      name: `order ${i}`,
      xml: x,
      expect,
      opt: {
        xmlns: true,
      },
    });
  });
});
