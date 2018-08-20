"use strict";

const { test } = require(".");

describe("fragments", () => {
  test({
    name: "empty",
    xml: "",
    expect: [],
    opt: {
      xmlns: true,
      fragment: true,
    },
  });

  test({
    name: "text only",
    xml: "   Something   ",
    expect: [
      ["text", "   Something   "],
    ],
    opt: {
      xmlns: true,
      fragment: true,
    },
  });

  test({
    name: "text and elements",
    xml: "Something <blah><more>blah</more></blah> something",
    expect: [
      ["text", "Something "],
      ["opentagstart", {
        name: "blah",
        attributes: {},
        ns: {},
      }],
      ["opentag", {
        name: "blah",
        local: "blah",
        prefix: "",
        uri: "",
        attributes: {},
        ns: {},
        isSelfClosing: false,
      }],
      ["opentagstart", {
        name: "more",
        attributes: {},
        ns: {},
      }],
      ["opentag", {
        name: "more",
        local: "more",
        prefix: "",
        uri: "",
        attributes: {},
        ns: {},
        isSelfClosing: false,
      }],
      ["text", "blah"],
      ["closetag", {
        name: "more",
        local: "more",
        prefix: "",
        uri: "",
        attributes: {},
        ns: {},
        isSelfClosing: false,
      }],
      ["closetag", {
        name: "blah",
        local: "blah",
        prefix: "",
        uri: "",
        attributes: {},
        ns: {},
        isSelfClosing: false,
      }],
      ["text", " something"],
    ],
    opt: {
      xmlns: true,
      fragment: true,
    },
  });

  test({
    name: "two top-level elements",
    xml: "Something <blah>1</blah><more>2</more> something",
    expect: [
      ["text", "Something "],
      ["opentagstart", {
        name: "blah",
        attributes: {},
        ns: {},
      }],
      ["opentag", {
        name: "blah",
        local: "blah",
        prefix: "",
        uri: "",
        attributes: {},
        ns: {},
        isSelfClosing: false,
      }],
      ["text", "1"],
      ["closetag", {
        name: "blah",
        local: "blah",
        prefix: "",
        uri: "",
        attributes: {},
        ns: {},
        isSelfClosing: false,
      }],
      ["opentagstart", {
        name: "more",
        attributes: {},
        ns: {},
      }],
      ["opentag", {
        name: "more",
        local: "more",
        prefix: "",
        uri: "",
        attributes: {},
        ns: {},
        isSelfClosing: false,
      }],
      ["text", "2"],
      ["closetag", {
        name: "more",
        local: "more",
        prefix: "",
        uri: "",
        attributes: {},
        ns: {},
        isSelfClosing: false,
      }],
      ["text", " something"],
    ],
    opt: {
      xmlns: true,
      fragment: true,
    },
  });

  test({
    name: "namespaces",
    xml: "Something <foo:blah>1</foo:blah> something",
    expect: [
      ["text", "Something "],
      ["opentagstart", {
        name: "foo:blah",
        attributes: {},
        ns: {},
      }],
      ["opentag", {
        name: "foo:blah",
        local: "blah",
        prefix: "foo",
        uri: "foo-uri",
        attributes: {},
        ns: {},
        isSelfClosing: false,
      }],
      ["text", "1"],
      ["closetag", {
        name: "foo:blah",
        local: "blah",
        prefix: "foo",
        uri: "foo-uri",
        attributes: {},
        ns: {},
        isSelfClosing: false,
      }],
      ["text", " something"],
    ],
    opt: {
      xmlns: true,
      fragment: true,
      additionalNamespaces: {
        foo: "foo-uri",
      },
    },
  });

  test({
    name: "resolvePrefix",
    xml: "Something <foo:blah>1</foo:blah> something",
    expect: [
      ["text", "Something "],
      ["opentagstart", {
        name: "foo:blah",
        attributes: {},
        ns: {},
      }],
      ["opentag", {
        name: "foo:blah",
        local: "blah",
        prefix: "foo",
        uri: "foo-uri",
        attributes: {},
        ns: {},
        isSelfClosing: false,
      }],
      ["text", "1"],
      ["closetag", {
        name: "foo:blah",
        local: "blah",
        prefix: "foo",
        uri: "foo-uri",
        attributes: {},
        ns: {},
        isSelfClosing: false,
      }],
      ["text", " something"],
    ],
    opt: {
      xmlns: true,
      fragment: true,
      resolvePrefix(prefix) {
        return {
          foo: "foo-uri",
        }[prefix];
      },
    },
  });
});
