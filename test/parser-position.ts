import { expect } from "chai";

import { EVENTS, SaxesOptions, SaxesParser } from "../build/dist/saxes";
import { test } from "./testutil";

interface ExpectedPosition {
  position?: number;
  line?: number;
  column?: number;
}

type ExpectedEvent = readonly [string, ExpectedPosition, string?];

function testPosition(name: string, chunks: string[],
                      expectedEvents: readonly ExpectedEvent[],
                      options?: SaxesOptions): void {
  it(name, () => {
    const parser = new SaxesParser(options);
    let expectedIx = 0;
    for (const ev of EVENTS) {
      // eslint-disable-next-line no-loop-func, @typescript-eslint/no-explicit-any
      parser.on(ev, (thing: any) => {
        const [expectedEvent, expectedPosition, expectedText] =
              expectedEvents[expectedIx++];
        expect(expectedEvent).to.equal(ev);
        // eslint-disable-next-line guard-for-in
        for (const prop in expectedPosition) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
          expect((parser as any)[prop], `bad ${prop}`)
            .to.deep.equal(expectedPosition[prop as keyof ExpectedPosition]);
        }

        if (expectedEvent === "text" && expectedText !== undefined) {
          expect(thing).to.equal(expectedText);
        }
      });
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
      ["text", { position: 14 }],
      ["closetag", { position: 19 }],
    ]);

  testPosition(
    "with multiple chunks",
    ["<div>abcde", "fgh</div>"], [
      ["opentagstart", { position: 5 }],
      ["opentag", { position: 5 }],
      ["text", { position: 14 }],
      ["closetag", { position: 19 }],
    ]);

  const newlines = "<div>abcde\r\n<foo/>f\rgh\r\ri\u0085j\u2028k</div>";
  const trailingCr: string[] = [];
  for (const x of newlines.split("\r")) {
    trailingCr.push(x, "\r");
  }
  const oneByOne = newlines.split("");

  describe("XML 1.0", () => {
    const expected = [
      ["opentagstart", { position: 5, line: 1, column: 5 }],
      ["opentag", { position: 5, line: 1, column: 5 }],
      ["text", { position: 13, line: 2, column: 1 }, "abcde\n"],
      ["opentagstart", { position: 17, line: 2, column: 5 }],
      ["opentag", { position: 18, line: 2, column: 6 }],
      ["closetag", { position: 18, line: 2, column: 6 }],
      ["text", { position: 30, line: 5, column: 6 },
       "f\ngh\n\ni\u0085j\u2028k"],
      ["closetag", { position: 35, line: 5, column: 11 }],
    ] as const;

    testPosition("with various newlines", [newlines], expected);
    testPosition("with various newlines (one-by-one)", oneByOne, expected);
    testPosition("trailing CR", trailingCr, expected);
  });

  describe("XML 1.1", () => {
    const expected = [
      ["opentagstart", { position: 5, line: 1, column: 5 }],
      ["opentag", { position: 5, line: 1, column: 5 }],
      ["text", { position: 13, line: 2, column: 1 }, "abcde\n"],
      ["opentagstart", { position: 17, line: 2, column: 5 }],
      ["opentag", { position: 18, line: 2, column: 6 }],
      ["closetag", { position: 18, line: 2, column: 6 }],
      ["text", { position: 30, line: 7, column: 2 }, "f\ngh\n\ni\nj\nk"],
      ["closetag", { position: 35, line: 7, column: 7 }],
    ] as const;

    testPosition("with various newlines", [newlines], expected, {
      defaultXMLVersion: "1.1",
    });
    testPosition("with various newlines (one-by-one)", oneByOne, expected, {
      defaultXMLVersion: "1.1",
    });
    testPosition("trailing CR", trailingCr, expected, {
      defaultXMLVersion: "1.1",
    });
  });

  testPosition("astral plane", ["<a>💩</a>"], [
    ["opentagstart", { position: 3, line: 1, column: 3 }],
    ["opentag", { position: 3, line: 1, column: 3 }],
    ["text", { position: 6, line: 1, column: 5 }],
    ["closetag", { position: 9, line: 1, column: 8 }],
  ]);

  test({
    name: "empty document",
    xml: "",
    expect: [
      ["error", "fnord.xml:1:0: document must contain a root element."],
    ],
    opt: {
      fileName: "fnord.xml",
    },
  });
});
