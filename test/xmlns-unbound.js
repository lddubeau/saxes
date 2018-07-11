"use strict";

const { test } = require(".");

describe("xmlns unbound prefixes", () => {
  test({
    name: "unbound element",
    opt: { xmlns: true },
    expect: [
      [
        "opentagstart",
        {
          name: "unbound:root",
          attributes: {},
          ns: {},
        },
      ],
      [
        "error",
        "undefined:1:15: unbound namespace prefix: \"unbound:root\".",
      ],
      [
        "opentag",
        {
          name: "unbound:root",
          uri: "unbound",
          prefix: "unbound",
          local: "root",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
      [
        "closetag",
        "unbound:root",
      ],
    ],
    fn(parser) {
      parser.write("<unbound:root/>");
    },
  });

  test({
    name: "bound element",
    opt: {
      xmlns: true,
    },
    expect: [
      [
        "opentagstart",
        {
          name: "unbound:root",
          attributes: {},
          ns: {},
        },
      ],
      [
        "opentag",
        {
          name: "unbound:root",
          uri: "someuri",
          prefix: "unbound",
          local: "root",
          attributes: {
            "xmlns:unbound": {
              name: "xmlns:unbound",
              value: "someuri",
              prefix: "xmlns",
              local: "unbound",
              uri: "http://www.w3.org/2000/xmlns/",
            },
          },
          ns: {
            unbound: "someuri",
          },
          isSelfClosing: true,
        },
      ],
      [
        "closetag",
        "unbound:root",
      ],
    ],
    fn(parser) {
      parser.write("<unbound:root xmlns:unbound=\"someuri\"/>");
    },
  });

  test({
    name: "unbound attribute",
    opt: { xmlns: true },
    expect: [
      [
        "opentagstart",
        {
          name: "root",
          attributes: {},
          ns: {},
        },
      ],
      [
        "error",
        "undefined:1:28: unbound namespace prefix: \"unbound\".",
      ],
      [
        "opentag",
        {
          name: "root",
          uri: "",
          prefix: "",
          local: "root",
          attributes: {
            "unbound:attr": {
              name: "unbound:attr",
              value: "value",
              uri: "unbound",
              prefix: "unbound",
              local: "attr",
            },
          },
          ns: {},
          isSelfClosing: true,
        },
      ],
      [
        "closetag",
        "root",
      ],
    ],
    fn(parser) {
      parser.write("<root unbound:attr='value'/>");
    },
  });
});
