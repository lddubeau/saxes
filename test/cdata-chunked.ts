import { SaxesParser } from "../build/dist/saxes";
import { test } from "./testutil";

test({
  name: "cdata chunked",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["cdata", " this is character data  "],
    ["closetag", { name: "r", attributes: {}, isSelfClosing: false }],
  ],
  fn(parser: SaxesParser): void {
    parser.write("<r><![CDATA[ this is ").write("character data  ")
      .write("]]></r>")
      .close();
  },
});
