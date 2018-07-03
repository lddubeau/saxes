"use strict";

const { expect } = require("chai");
const saxes = require("../lib/saxes");

function testPosition(name, chunks, expectedEvents) {
  it(name, () => {
    const parser = saxes.parser();
    for (const expectation of expectedEvents) {
      parser[`on${expectation[0]}`] = function handler() {
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
      ["opentagstart", { position: 5, startTagPosition: 1 }],
      ["opentag", { position: 5, startTagPosition: 1 }],
      ["text", { position: 19, startTagPosition: 14 }],
      ["closetag", { position: 19, startTagPosition: 14 }],
    ]);

  testPosition(
    "with multiple chunks",
    ["<div>abcde", "fgh</div>"], [
      ["opentagstart", { position: 5, startTagPosition: 1 }],
      ["opentag", { position: 5, startTagPosition: 1 }],
      ["text", { position: 19, startTagPosition: 14 }],
      ["closetag", { position: 19, startTagPosition: 14 }],
    ]);
});
