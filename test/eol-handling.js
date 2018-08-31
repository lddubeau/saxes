"use strict";

const { test } = require(".");

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

describe("eol handling", () => {
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
