import { SaxesParser } from "../build/dist/saxes";
import { test } from "./testutil";

test({
  name: "attribute unquoted",
  expect: [
    ["opentagstart", { name: "root", attributes: {}, ns: {} }],
    ["error", "1:14: unquoted attribute value."],
    ["attribute", {
      name: "length",
      value: "12345",
      prefix: "",
      local: "length",
    }],
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
  fn(parser: SaxesParser): void {
    parser.write("<root length=12").write("345></root>").close();
  },
});
