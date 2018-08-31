"use strict";

const { expect } = require("chai");
const saxes = require("../lib/saxes");
const { test } = require(".");

function testPosition(name, chunks, expectedEvents) {
  it(name, () => {
    const parser = new saxes.SaxesParser();
    let expectedIx = 0;
    for (const ev of saxes.EVENTS) {
      // eslint-disable-next-line no-loop-func
      parser[`on${ev}`] = () => {
        const expectation = expectedEvents[expectedIx++];
        expect(expectation[0]).to.equal(ev);
        // eslint-disable-next-line guard-for-in
        for (const prop in expectation[1]) {
          expect(parser[prop]).to.deep.equal(expectation[1][prop]);
        }
      };
    }

    for (const chunk of chunks) {
      parser.write(chunk);
    }
  });
}

describe("parser position", () => {
  testPosition(
    "with single chunk",
    ["<div>abcdefgh</div>"], [
      ["opentagstart", { position: 5 }],
      ["opentag", { position: 5 }],
      ["text", { position: 19 }],
      ["closetag", { position: 19 }],
    ]);

  testPosition(
    "with multiple chunks",
    ["<div>abcde", "fgh</div>"], [
      ["opentagstart", { position: 5 }],
      ["opentag", { position: 5 }],
      ["text", { position: 19 }],
      ["closetag", { position: 19 }],
    ]);

  testPosition(
    "with various newlines",
    ["<div>abcde\r\n<foo/>f\rgh</div>"], [
      ["opentagstart", { position: 5, line: 1, column: 5 }],
      ["opentag", { position: 5, line: 1, column: 5 }],
      ["text", { position: 17, line: 2, column: 5 }],
      ["opentagstart", { position: 17, line: 2, column: 5 }],
      ["opentag", { position: 18, line: 2, column: 6 }],
      ["closetag", { position: 18, line: 2, column: 6 }],
      ["text", { position: 28, line: 3, column: 8 }],
      ["closetag", { position: 28, line: 3, column: 8 }],
    ]);

  test({
    name: "pi before root",
    xml: "",
    expect: [
      ["error", "fnord.xml:1:0: document must contain a root element."],
    ],
    opt: {
      fileName: "fnord.xml",
    },
  });
});
