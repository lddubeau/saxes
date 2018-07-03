"use strict";

const { expect } = require("chai");
const saxes = require("../");

it("parses a buffer", () => {
  const parser = saxes.parser();
  let seen = false;
  parser.onopentag = (node) => {
    expect(node).to.deep.equal({ name: "x", attributes: {}, isSelfClosing: false });
    seen = true;
  };
  const xml = Buffer.from("<x>y</x>");
  parser.write(xml).close();
  expect(seen).to.be.true;
});
