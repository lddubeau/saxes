"use strict";

require(".").test({
  name: "attribute unquoted",
  expect: [
    ["opentagstart", { name: "root", attributes: {}, ns: {} }],
    ["error", "1:14: unquoted attribute value."],
    ["opentag", {
      name: "root",
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
      prefix: "",
      local: "root",
      uri: "",
      isSelfClosing: false,
    }],
    ["closetag", {
      name: "root",
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
      prefix: "",
      local: "root",
      uri: "",
      isSelfClosing: false,
    }],
    ["end", undefined],
    ["ready", undefined],
  ],
  opt: {
    xmlns: true,
  },
  fn(parser) {
    parser.write("<root length=12").write("345></root>")
      .close();
  },
});
