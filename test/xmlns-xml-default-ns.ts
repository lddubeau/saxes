import { test } from "./testutil";

const xmlnsAttr = {
  name: "xmlns",
  value: "http://foo",
  prefix: "",
  local: "xmlns",
  uri: "http://www.w3.org/2000/xmlns/",
};

const attrAttr = {
  name: "attr",
  value: "bar",
  prefix: "",
  local: "attr",
  uri: "",
};

test({
  name: "xmlns set default namespace",
  xml: "<elm xmlns='http://foo' attr='bar'/>",
  expect: [
    [
      "opentagstart",
      {
        name: "elm",
        attributes: {},
        ns: {},
      },
    ],
    [
      "attribute",
      {
        name: "xmlns",
        value: "http://foo",
        prefix: "",
        local: "xmlns",
      },
    ],
    [
      "attribute",
      {
        name: "attr",
        value: "bar",
        prefix: "",
        local: "attr",
      },
    ],
    [
      "opentag",
      {
        name: "elm",
        prefix: "",
        local: "elm",
        uri: "http://foo",
        ns: { "": "http://foo" },
        attributes: {
          xmlns: xmlnsAttr,
          attr: attrAttr,
        },
        isSelfClosing: true,
      },
    ],
    [
      "closetag",
      {
        name: "elm",
        prefix: "",
        local: "elm",
        uri: "http://foo",
        ns: { "": "http://foo" },
        attributes: {
          xmlns: xmlnsAttr,
          attr: attrAttr,
        },
        isSelfClosing: true,
      },
    ],
  ],
  opt: {
    xmlns: true,
  },
});
