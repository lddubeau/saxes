import { test } from "./testutil";

test({
  name: "attribute normalization",
  // \n\r is converted to \n\n internally. The reverse would be converted to
  // only \n.
  // eslint-disable-next-line @typescript-eslint/quotes
  xml: `<root attr1="&#xD;&#x20;&#xA;&#x9;" attr2="\n\r\ta  b"/>`,
  expect: [
    ["opentagstart", {
      name: "root",
      attributes: {},
    }],
    ["attribute", {
      name: "attr1",
      value: "\r \n\t",
    }],
    ["attribute", {
      name: "attr2",
      value: "   a  b",
    }],
    ["opentag", {
      name: "root",
      attributes: { attr1: "\r \n\t", attr2: "   a  b" },
      isSelfClosing: true,
    }],
    ["closetag", {
      name: "root",
      attributes: { attr1: "\r \n\t", attr2: "   a  b" },
      isSelfClosing: true,
    }],
  ],
  opt: { },
});
