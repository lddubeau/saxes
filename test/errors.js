"use strict";

require(".").test({
  name: "without fileName",
  xml: "<doc>",
  expect: [
    ["opentagstart", { name: "doc", attributes: {} }],
    ["opentag", { name: "doc", isSelfClosing: false, attributes: {} }],
    ["error", "1:5: unclosed tag: doc"],
  ],
  opt: {},
});

require(".").test({
  name: "with fileName",
  xml: "<doc>",
  expect: [
    ["opentagstart", { name: "doc", attributes: {} }],
    ["opentag", { name: "doc", isSelfClosing: false, attributes: {} }],
    ["error", "foobar.xml:1:5: unclosed tag: doc"],
  ],
  opt: {
    fileName: "foobar.xml",
  },
});

require(".").test({
  name: "with fileName, when not tracking position position",
  xml: "<doc>",
  expect: [
    ["opentagstart", { name: "doc", attributes: {} }],
    ["opentag", { name: "doc", isSelfClosing: false, attributes: {} }],
    ["error", "foobar.xml: unclosed tag: doc"],
  ],
  opt: {
    fileName: "foobar.xml",
    position: false,
  },
});
