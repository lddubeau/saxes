import { SaxesParser } from "../build/dist/saxes";
import { test } from "./testutil";

describe("eol handling", () => {
  describe("mixed", () => {
    /* eslint-disable linebreak-style */
    const xml = `\
<?xml version="1.0" encoding="utf-8"?>

<moo a="12
        3"
     >
  abc
  def&#xD;
  ghi
  xxxx
</moo>
`;
    /* eslint-enable linebreak-style */

    const expect = [
      [
        "xmldecl",
        {
          encoding: "utf-8",
          version: "1.0",
          standalone: undefined,
        },
      ],
      ["text", "\n\n"],
      ["opentagstart", { name: "moo", attributes: {} }],
      ["attribute", {
        name: "a",
        value: "12         3",
      }],
      ["opentag", {
        name: "moo",
        attributes: {
          a: "12         3",
        },
        isSelfClosing: false,
      }],
      ["text", "\n  abc\n  def\r\n  ghi\n\n  xx\nxx\n"],
      ["closetag", {
        name: "moo",
        attributes: {
          a: "12         3",
        },
        isSelfClosing: false,
      }],
      ["text", "\n"],
    ];

    test({
      name: "one chunk",
      xml,
      expect,
    });

    test({
      name: "char-by-char",
      expect,
      fn(parser: SaxesParser): void {
        for (const x of xml) {
          parser.write(x);
        }
        parser.close();
      },
    });
  });

  // The comprehensive test is meant to have EOL in all possible contexts.
  describe("comprehensive", () => {
    const nl = `\
<?xml
version
=
"1.0"
encoding
=
"utf-8"
standalone
=
"no"
?>
<!DOCTYPE
root
[
<!--
I'm a test.
-->
<?
I'm a test.
?>
<!NOTATION
not1
SYSTEM
"]>"
>
]>
<!--
-->
<?fnord
?>
<moo
a
=
"12
        3"
b
=
"
z
"
>
abc
&#xD;

<!--
-->
<?fnord
?>
<abc
a
=
"bc"
/>
</moo
>
`;
    const xmlDeclEnd = nl.indexOf("?>");

    const expect = [
      [
        "xmldecl",
        {
          encoding: "utf-8",
          version: "1.0",
          standalone: "no",
        },
      ],
      ["text", "\n"],
      ["doctype", `
root
[
<!--
I'm a test.
-->
<?
I'm a test.
?>
<!NOTATION
not1
SYSTEM
"]>"
>
]`],
      ["text", "\n"],
      ["comment", "\n"],
      ["text", "\n"],
      ["processinginstruction", { target: "fnord", body: "" }],
      ["text", "\n"],
      ["opentagstart", { name: "moo", attributes: {} }],
      ["attribute", {
        name: "a",
        value: "12         3",
      }],
      ["attribute", {
        name: "b",
        value: " z ",
      }],
      ["opentag", {
        name: "moo",
        attributes: {
          a: "12         3",
          b: " z ",
        },
        isSelfClosing: false,
      }],
      ["text", `
abc
\r

`],
      ["comment", "\n"],
      ["text", "\n"],
      ["processinginstruction", { target: "fnord", body: "" }],
      ["text", "\n"],
      ["opentagstart", { name: "abc", attributes: {} }],
      ["attribute", {
        name: "a",
        value: "bc",
      }],
      ["opentag", {
        name: "abc",
        attributes: {
          a: "bc",
        },
        isSelfClosing: true,
      }],
      ["closetag", {
        name: "abc",
        attributes: {
          a: "bc",
        },
        isSelfClosing: true,
      }],
      ["text", "\n"],
      ["closetag", {
        name: "moo",
        attributes: {
          a: "12         3",
          b: " z ",
        },
        isSelfClosing: false,
      }],
      ["text", "\n"],
    ] as const;

    const fixed11 =
      expect.map(x => (x[0] === "xmldecl" ?
        [x[0], { ...x[1], version: "1.1" }] : x));

    describe("nl", () => {
      test({
        name: "one chunk",
        xml: nl,
        expect,
      });

      test({
        name: "char-by-char",
        expect,
        fn(parser: SaxesParser): void {
          for (const x of nl) {
            parser.write(x);
          }
          parser.close();
        },
      });
    });

    describe("cr", () => {
      const cr = nl.replace(/\n/g, "\r");

      test({
        name: "one chunk",
        xml: cr,
        expect,
      });

      test({
        name: "char-by-char",
        expect,
        fn(parser: SaxesParser): void {
          for (const x of cr) {
            parser.write(x);
          }
          parser.close();
        },
      });
    });

    describe("crnl", () => {
      const crnl = nl.replace(/\n/g, "\r\n");

      test({
        name: "one chunk",
        xml: crnl,
        expect,
      });

      test({
        name: "char-by-char",
        expect,
        fn(parser: SaxesParser): void {
          for (const x of crnl) {
            parser.write(x);
          }
          parser.close();
        },
      });
    });

    describe("nel", () => {
      // We have to switch the EOL characters after the XML declaration.
      const nel = nl.slice(0, xmlDeclEnd).replace("1.0", "1.1") +
        nl.slice(xmlDeclEnd).replace(/\n/g, "\u0085");

      test({
        name: "one chunk",
        xml: nel,
        expect: fixed11,
      });

      test({
        name: "char-by-char",
        expect: fixed11,
        fn(parser: SaxesParser): void {
          for (const x of nel) {
            parser.write(x);
          }
          parser.close();
        },
      });
    });

    describe("ls", () => {
      // We have to switch the EOL characters after the XML declaration.
      const ls = nl.slice(0, xmlDeclEnd).replace("1.0", "1.1") +
            nl.slice(xmlDeclEnd).replace(/\n/g, "\u2028");

      test({
        name: "one chunk",
        xml: ls,
        expect: fixed11,
      });

      test({
        name: "char-by-char",
        expect: fixed11,
        fn(parser: SaxesParser): void {
          for (const x of ls) {
            parser.write(x);
          }
          parser.close();
        },
      });
    });
  });

  describe("bad start", () => {
    const xml = `
<?xml version="1.0" encoding="utf-8"?><doc/>`;
    const expect = [
      [
        "error",
        "2:6: an XML declaration must be at the start of the document.",
      ],
      [
        "xmldecl",
        {
          encoding: "utf-8",
          version: "1.0",
          standalone: undefined,
        },
      ],
      ["opentagstart", {
        name: "doc",
        attributes: {},
      }],
      ["opentag", {
        name: "doc",
        attributes: {},
        isSelfClosing: true,
      }],
      ["closetag", {
        name: "doc",
        attributes: {},
        isSelfClosing: true,
      }],
    ];

    describe("with nl as eol", () => {
      test({
        name: "one chunk",
        xml,
        expect,
      });

      test({
        name: "char-by-char",
        expect,
        fn(parser: SaxesParser): void {
          for (const x of xml) {
            parser.write(x);
          }
          parser.close();
        },
      });
    });

    describe("with crnl as eol", () => {
      const crnl = xml.replace(/\n/g, "\r\n");
      test({
        name: "one chunk",
        xml: crnl,
        expect,
      });

      test({
        name: "char-by-char",
        expect,
        fn(parser: SaxesParser): void {
          for (const x of crnl) {
            parser.write(x);
          }
          parser.close();
        },
      });
    });
  });
});
