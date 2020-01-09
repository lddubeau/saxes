// import { expectType } from "tsd";

// import { SaxesParser, SaxesStartTag, SaxesStartTagNS, SaxesStartTagPlain,
//          SaxesTag, SaxesTagNS, SaxesTagPlain } from "../build/dist/saxes";

// describe("typings", () => {
//   describe("of onopentagstart", () => {
//     it("a parser with xmlns true passes SaxesStartTagNS", () => {
//       expectType<(tag: SaxesStartTagNS) => void>(
//         // eslint-disable-next-line @typescript-eslint/unbound-method
//         new SaxesParser({ xmlns: true }).onopentagstart);
//     });

//     it("a parser with xmlns false is a SaxesParserPlain", () => {
//       expectType<(tag: SaxesStartTagPlain) => void>(
//         // eslint-disable-next-line @typescript-eslint/unbound-method
//         new SaxesParser({ xmlns: false }).onopentagstart);
//     });

//     it("a parser with xmlns unset is a SaxesParser", () => {
//       expectType<(tag: SaxesStartTag) => void>(
//         // eslint-disable-next-line @typescript-eslint/unbound-method
//         new SaxesParser(Object.create(null)).onopentagstart);
//     });
//   });

//   describe("of onopentag", () => {
//     it("a parser with xmlns true passes SaxesStartTagNS", () => {
//       expectType<(tag: SaxesTagNS) => void>(
//         // eslint-disable-next-line @typescript-eslint/unbound-method
//         new SaxesParser({ xmlns: true }).onopentag);
//     });

//     it("a parser with xmlns false is a SaxesParserPlain", () => {
//       expectType<(tag: SaxesTagPlain) => void>(
//         // eslint-disable-next-line @typescript-eslint/unbound-method
//         new SaxesParser({ xmlns: false }).onopentag);
//     });

//     it("a parser with xmlns unset is a SaxesParser", () => {
//       expectType<(tag: SaxesTag) => void>(
//         // eslint-disable-next-line @typescript-eslint/unbound-method
//         new SaxesParser(Object.create(null)).onopentag);
//     });
//   });
// });
