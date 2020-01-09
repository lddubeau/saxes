import { expect } from "chai";

import { SaxesParser, SaxesTagPlain } from "../build/dist/saxes";

it("parses a buffer", () => {
  const parser = new SaxesParser();
  let seen = false;
  parser.on("opentag", (node: SaxesTagPlain) => {
    expect(node).to.deep.equal({
      name: "x",
      attributes: {},
      isSelfClosing: false,
    });
    seen = true;
  });
  parser.write(Buffer.from("<x>y</x>")).close();
  expect(seen).to.be.true;
});
