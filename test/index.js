"use strict";

const { expect } = require("chai");
const saxes = require("../lib/saxes");

// handy way to do simple unit tests
// if the options contains an xml string, it'll be written and the parser closed.
// otherwise, it's assumed that the test will write and close.
exports.test = function test(options) {
  const { xml, name, expect: expected, fn } = options;
  it(name, () => {
    const parser = saxes.parser(options.opt);
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

        if (ev === "error") {
          expect([ev, n.message]).to.deep.equal(expected[expectedIx]);
          parser.resume();
        }
        else {
          if (ev === "opentagstart" || ev === "opentag") {
            if (n.ns) {
              // We have to remove the prototype from n.ns. Otherwise,
              // the deep equal check fails because the tests were
              // written to check only the namespaces immediately
              // defined on the tag whereas deep equal compares
              // **all** enumerable properties and thus effectively
              // examines up the chain of namespaces.

              n = Object.assign({}, n);

              // We shallow copy.
              n.ns = Object.assign(Object.create(null), n.ns);
            }
          }

          expect([ev, n]).to.deep.equal(expected[expectedIx]);
        }

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
