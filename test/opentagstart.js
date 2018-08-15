"use strict";

const { test } = require(".");

describe("openstarttag", () => {
  test({
    name: "good name, xmlns true",
    xml: "<root length='12345'></root>",
    expect: [
      [
        "opentagstart",
        {
          name: "root",
          ns: {},
          attributes: {},
        },
      ],
      [
        "opentag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {
            length: {
              name: "length",
              value: "12345",
              prefix: "",
              local: "length",
              uri: "",
            },
          },
          ns: {},
          isSelfClosing: false,
        },
      ],
      [
        "closetag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {
            length: {
              name: "length",
              value: "12345",
              prefix: "",
              local: "length",
              uri: "",
            },
          },
          ns: {},
          isSelfClosing: false,
        },
      ],
    ],
    opt: {
      xmlns: true,
    },
  });

  test({
    name: "good name, xmlns false",
    xml: "<root length='12345'></root>",
    expect: [
      [
        "opentagstart",
        {
          name: "root",
          attributes: {},
        },
      ],
      [
        "opentag",
        {
          name: "root",
          attributes: {
            length: "12345",
          },
          isSelfClosing: false,
        },
      ],
      [
        "closetag",
        {
          name: "root",
          attributes: {
            length: "12345",
          },
          isSelfClosing: false,
        },
      ],
    ],
  });
});
