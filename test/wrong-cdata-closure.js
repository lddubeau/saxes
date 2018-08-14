"use strict";

const { test } = require(".");

const xml = "<span>somethingx]]>moo</span>";

describe("wrong cdata closure", () => {
  test({
    name: "one shot",
    xml,
    expect: [
      ["opentagstart", {
        name: "span",
        attributes: {},
      }],
      ["opentag", {
        name: "span",
        attributes: {},
        isSelfClosing: false,
      }],
      ["error",
       "undefined:1:23: the string \"]]>\" is disallowed in char data."],
      ["text", "somethingx]]>moo"],
      ["closetag", {
        name: "span",
        attributes: {},
        isSelfClosing: false,
      }],
      ["end", undefined],
      ["ready", undefined],
    ],
    opt: {},
  });

  test({
    name: "one-by-one",
    fn(parser) {
      for (const x of xml) {
        parser.write(x);
      }
      parser.close();
    },
    expect: [
      ["opentagstart", {
        name: "span",
        attributes: {},
      }],
      ["opentag", {
        name: "span",
        attributes: {},
        isSelfClosing: false,
      }],
      ["error",
       "undefined:1:19: the string \"]]>\" is disallowed in char data."],
      ["text", "somethingx]]>moo"],
      ["closetag", {
        name: "span",
        attributes: {},
        isSelfClosing: false,
      }],
      ["end", undefined],
      ["ready", undefined],
    ],
    opt: {},
  });

  test({
    name: "two-by-two",
    fn(parser) {
      for (let ix = 0; ix < xml.length; ix += 2) {
        parser.write(xml.slice(ix, ix + 2));
      }
      parser.close();
    },
    expect: [
      ["opentagstart", {
        name: "span",
        attributes: {},
      }],
      ["opentag", {
        name: "span",
        attributes: {},
        isSelfClosing: false,
      }],
      ["error",
       "undefined:1:20: the string \"]]>\" is disallowed in char data."],
      ["text", "somethingx]]>moo"],
      ["closetag", {
        name: "span",
        attributes: {},
        isSelfClosing: false,
      }],
      ["end", undefined],
      ["ready", undefined],
    ],
    opt: {},
  });
});
