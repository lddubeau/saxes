import { expect } from "chai";

import { EventName, EVENTS, SaxesOptions,
         SaxesParser } from "../build/dist/saxes";

export interface TestOptions {
  xml?: string | readonly string[];
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expect: readonly any[];
  // eslint-disable-next-line @typescript-eslint/ban-types
  fn?: (parser: SaxesParser<{}>) => void;
  opt?: SaxesOptions;
  events?: readonly EventName[];
}

export function test(options: TestOptions): void {
  const { xml, name, expect: expected, fn, events } = options;
  it(name, () => {
    const parser = new SaxesParser(options.opt);
    let expectedIx = 0;
    for (const ev of events ?? EVENTS) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-loop-func
      parser.on(ev, (n: any) => {
        if (process.env.DEBUG !== undefined) {
          console.error({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            expected: expected[expectedIx],
            actual: [ev, n],
          });
        }
        if (expectedIx >= expected.length && (ev === "end" || ev === "ready")) {
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect([ev, ev === "error" ? n.message : n]).to.deep
          .equal(expected[expectedIx]);
        expectedIx++;
      });
    }

    expect(xml !== undefined || fn !== undefined, "must use xml or fn")
      .to.be.true;

    if (xml !== undefined) {
      if (Array.isArray(xml)) {
        for (const chunk of xml as readonly string[]) {
          parser.write(chunk);
        }
        parser.close();
      }
      else {
        parser.write(xml as string).close();
      }
    }

    fn?.(parser);

    expect(expectedIx).to.equal(expected.length);
  });
}
