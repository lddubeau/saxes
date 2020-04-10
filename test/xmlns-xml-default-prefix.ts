import { test } from "./testutil";

describe("xml default prefix", () => {
  test({
    name: "element",
    xml: "<xml:root/>",
    expect: [
      [
        "opentagstart",
        {
          name: "xml:root",
          attributes: {},
          ns: {},
        },
      ],
      [
        "opentag",
        {
          name: "xml:root",
          uri: "http://www.w3.org/XML/1998/namespace",
          prefix: "xml",
          local: "root",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
      [
        "closetag",
        {
          name: "xml:root",
          uri: "http://www.w3.org/XML/1998/namespace",
          prefix: "xml",
          local: "root",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
    ],
    opt: { xmlns: true },
  });

  test({
    name: "attribute",
    xml: "<root xml:lang='en'/>",
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
        "attribute",
        {
          name: "xml:lang",
          local: "lang",
          prefix: "xml",
          value: "en",
        },
      ],
      [
        "opentag",
        {
          name: "root",
          uri: "",
          prefix: "",
          local: "root",
          attributes: {
            "xml:lang": {
              name: "xml:lang",
              local: "lang",
              prefix: "xml",
              uri: "http://www.w3.org/XML/1998/namespace",
              value: "en",
            },
          },
          ns: {},
          isSelfClosing: true,
        },
      ],
      [
        "closetag",
        {
          name: "root",
          uri: "",
          prefix: "",
          local: "root",
          attributes: {
            "xml:lang": {
              name: "xml:lang",
              local: "lang",
              prefix: "xml",
              uri: "http://www.w3.org/XML/1998/namespace",
              value: "en",
            },
          },
          ns: {},
          isSelfClosing: true,
        },
      ],
    ],
    opt: { xmlns: true },
  });

  test({
    name: "cannot be redefined",
    xml: "<xml:root xmlns:xml='ERROR'/>",
    expect: [
      [
        "opentagstart",
        {
          name: "xml:root",
          attributes: {},
          ns: {},
        },
      ],
      [
        "attribute",
        {
          name: "xmlns:xml",
          local: "xml",
          prefix: "xmlns",
          value: "ERROR",
        },
      ],
      [
        "error",
        "1:27: xml prefix must be bound to \
http://www.w3.org/XML/1998/namespace.",
      ],
      [
        "opentag",
        {
          name: "xml:root",
          uri: "ERROR",
          prefix: "xml",
          local: "root",
          attributes: {
            "xmlns:xml": {
              name: "xmlns:xml",
              local: "xml",
              prefix: "xmlns",
              uri: "http://www.w3.org/2000/xmlns/",
              value: "ERROR",
            },
          },
          ns: {
            xml: "ERROR",
          },
          isSelfClosing: true,
        },
      ],
      [
        "closetag",
        {
          name: "xml:root",
          uri: "ERROR",
          prefix: "xml",
          local: "root",
          attributes: {
            "xmlns:xml": {
              name: "xmlns:xml",
              local: "xml",
              prefix: "xmlns",
              uri: "http://www.w3.org/2000/xmlns/",
              value: "ERROR",
            },
          },
          ns: {
            xml: "ERROR",
          },
          isSelfClosing: true,
        },
      ],
    ],
    opt: { xmlns: true },
  });
});
