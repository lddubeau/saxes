"use strict";

const { test } = require(".");

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
      ["text", "\n\n"],
      ["opentagstart", { name: "moo", attributes: {} }],
      ["opentag", {
        name: "moo",
        attributes: {
          a: "12\n        3",
        },
        isSelfClosing: false,
      }],
      ["text", "\n  abc\n  def\r\n  ghi\n\n  xx\nxx\n"],
      ["closetag", {
        name: "moo",
        attributes: {
          a: "12\n        3",
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
      fn(parser) {
        for (const x of xml) {
          parser.write(x);
        }
        parser.close();
      },
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
        fn(parser) {
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
        fn(parser) {
          for (const x of crnl) {
            parser.write(x);
          }
          parser.close();
        },
      });
    });
  });
});
