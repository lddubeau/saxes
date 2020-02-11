import { SaxesParser } from "../build/dist/saxes";
import { test } from "./testutil";

describe("unicode test", () => {
  describe("poop", () => {
    const xml = "<a>💩</a>";
    const expect = [
      ["opentagstart", { name: "a", attributes: {} }],
      ["opentag", { name: "a", attributes: {}, isSelfClosing: false }],
      ["text", "💩"],
      ["closetag", { name: "a", attributes: {}, isSelfClosing: false }],
    ];

    test({
      name: "intact",
      xml,
      expect,
    });

    test({
      name: "sliced",
      fn(parser: SaxesParser): void {
        // This test purposely slices the string into the poop character.
        parser.write(xml.slice(0, 4));
        parser.write(xml.slice(4));
        parser.close();
      },
      expect,
    });
  });
});
