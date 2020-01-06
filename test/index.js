"use strict";

const { expect } = require("chai");
const saxes = require("../build/dist/saxes");

// handy way to do simple unit tests
// if the options contains an xml string, it'll be written and the parser closed.
// otherwise, it's assumed that the test will write and close.
exports.test = function test(options) {
  const { xml, name, expect: expected, fn } = options;
  it(name, () => {
    const parser = new saxes.SaxesParser(options.opt);
    let expectedIx = 0;
    for (const ev of saxes.EVENTS) {
      // eslint-disable-next-line no-loop-func
      parser[`on${ev}`] = (n) => {
        if (process.env.DEBUG) {
          // eslint-disable-next-line no-console
          console.error({
            expected: expected[expectedIx],
            actual: [ev, n],
          });
        }
        if (expectedIx >= expected.length && (ev === "end" || ev === "ready")) {
          return;
        }

        expect([ev, ev === "error" ? n.message : n]).to.deep
          .equal(expected[expectedIx]);
        expectedIx++;
      };
    }

    expect(xml !== undefined || fn !== undefined,
           "must use xml or fn").to.be.true;

    if (xml !== undefined) {
      parser.write(xml).close();
    }

    if (fn !== undefined) {
      fn(parser);
    }

    expect(expectedIx).to.equal(expected.length);
  });
};
