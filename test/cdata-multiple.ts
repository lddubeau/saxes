import { test } from "./testutil";

import { SaxesParser } from "../build/dist/saxes";

test({
  name: "cdata multiple",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["cdata", " this is "],
    ["cdata", "character data  "],
    ["closetag", { name: "r", attributes: {}, isSelfClosing: false }],
  ],
  fn(parser: SaxesParser): void {
    parser.write("<r><![CDATA[ this is ]]>").write("<![CDA")
      .write("T")
      .write("A[")
      .write("character data  ")
      .write("]]></r>")
      .close();
  },
});
