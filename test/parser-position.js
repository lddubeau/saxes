"use strict";

const saxes = require("../lib/saxes");
const tap = require("tap");

function testPosition(chunks, expectedEvents) {
  const parser = saxes.parser();
  expectedEvents.forEach((expectation) => {
    parser[`on${expectation[0]}`] = function handler() {
      // eslint-disable-next-line guard-for-in
      for (const prop in expectation[1]) {
        tap.equal(parser[prop], expectation[1][prop]);
      }
    };
  });
  chunks.forEach((chunk) => {
    parser.write(chunk);
  });
}

testPosition(["<div>abcdefgh</div>"], [
  ["opentagstart", { position: 5, startTagPosition: 1 }],
  ["opentag", { position: 5, startTagPosition: 1 }],
  ["text", { position: 19, startTagPosition: 14 }],
  ["closetag", { position: 19, startTagPosition: 14 }],
]);

testPosition(["<div>abcde", "fgh</div>"], [
  ["opentagstart", { position: 5, startTagPosition: 1 }],
  ["opentag", { position: 5, startTagPosition: 1 }],
  ["text", { position: 19, startTagPosition: 14 }],
  ["closetag", { position: 19, startTagPosition: 14 }],
]);
