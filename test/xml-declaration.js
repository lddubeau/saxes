"use strict";

const { expect } = require("chai");
const saxes = require("../lib/saxes");
const { test } = require(".");

describe("xml declaration", () => {
  test({
    name: "empty declaration",
    xml: "<?xml?><root/>",
    expect: [
      ["error", "1:7: XML declaration must contain a version."],
      ["opentagstart", { name: "root", attributes: {}, ns: {} }],
      [
        "opentag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
      [
        "closetag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
    ],
    opt: {
      xmlns: true,
    },
  });

  test({
    name: "version without value",
    xml: "<?xml version?><root/>",
    expect: [
      ["error", "1:15: XML declaration is incomplete."],
      ["opentagstart", { name: "root", attributes: {}, ns: {} }],
      [
        "opentag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
      [
        "closetag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
    ],
    opt: {
      xmlns: true,
    },
  });

  test({
    name: "version without value",
    xml: "<?xml version=?><root/>",
    expect: [
      ["error", "1:16: XML declaration is incomplete."],
      ["opentagstart", { name: "root", attributes: {}, ns: {} }],
      [
        "opentag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
      [
        "closetag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
    ],
    opt: {
      xmlns: true,
    },
  });

  test({
    name: "unquoted value",
    xml: "<?xml version=a?><root/>",
    expect: [
      ["error", "1:15: value must be quoted."],
      ["error", "1:17: XML declaration is incomplete."],
      ["opentagstart", { name: "root", attributes: {}, ns: {} }],
      [
        "opentag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
      [
        "closetag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
    ],
    opt: {
      xmlns: true,
    },
  });

  test({
    name: "unterminated value",
    xml: "<?xml version=\"a?><root/>",
    expect: [
      ["error", "1:18: XML declaration is incomplete."],
      ["opentagstart", { name: "root", attributes: {}, ns: {} }],
      [
        "opentag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
      [
        "closetag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
    ],
    opt: {
      xmlns: true,
    },
  });

  test({
    name: "bad version",
    xml: "<?xml version=\"a\"?><root/>",
    expect: [
      ["error", "1:17: version number must match /^1\\.[0-9]+$/."],
      ["opentagstart", { name: "root", attributes: {}, ns: {} }],
      [
        "opentag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
      [
        "closetag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
    ],
    opt: {
      xmlns: true,
    },
  });

  it("well-formed", () => {
    const parser = new saxes.SaxesParser();
    let seen = false;
    parser.onopentagstart = () => {
      expect(parser.xmlDecl).to.deep.equal({
        version: "1.1",
        encoding: "utf-8",
        standalone: "yes",
      });
      seen = true;
    };
    parser.write(
      "<?xml version=\"1.1\" encoding=\"utf-8\" standalone=\"yes\"?><root/>");
    parser.close();
    expect(seen).to.be.true;
  });
});
