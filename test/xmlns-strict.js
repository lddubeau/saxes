"use strict";

require(".").test({
  name: "xmlns strict",
  xml: "<root>" +
    "<plain attr=\"normal\" />" +
    "<ns1 xmlns=\"uri:default\">" +
    "<plain attr=\"normal\"/>" +
    "</ns1>" +
    "<ns2 xmlns:a=\"uri:nsa\">" +
    "<plain attr=\"normal\"/>" +
    "<a:ns a:attr=\"namespaced\"/>" +
    "</ns2>" +
    "</root>",
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
      "opentag",
      {
        name: "root",
        prefix: "",
        local: "root",
        uri: "",
        attributes: {},
        ns: {},
        isSelfClosing: false,
      },
    ],
    [
      "opentagstart",
      {
        name: "plain",
        attributes: {},
        ns: {},
      },
    ],
    [
      "opentag",
      {
        name: "plain",
        prefix: "",
        local: "plain",
        uri: "",
        attributes: {
          attr: {
            name: "attr",
            value: "normal",
            prefix: "",
            local: "attr",
            uri: "",
          },
        },
        ns: {},
        isSelfClosing: true,
      },
    ],
    [
      "closetag",
      "plain",
    ],
    [
      "opentagstart",
      {
        name: "ns1",
        attributes: {},
        ns: {},
      },
    ],
    [
      "opentag",
      {
        name: "ns1",
        prefix: "",
        local: "ns1",
        uri: "uri:default",
        attributes: {
          xmlns: {
            name: "xmlns",
            value: "uri:default",
            prefix: "xmlns",
            local: "",
            uri: "http://www.w3.org/2000/xmlns/",
          },
        },
        ns: {
          "": "uri:default",
        },
        isSelfClosing: false,
      },
    ],
    [
      "opentagstart",
      {
        name: "plain",
        ns: {},
        attributes: {},
      },
    ],
    [
      "opentag",
      {
        name: "plain",
        prefix: "",
        local: "plain",
        uri: "uri:default",
        ns: {},
        attributes: {
          attr: {
            name: "attr",
            value: "normal",
            prefix: "",
            local: "attr",
            uri: "",
          },
        },
        isSelfClosing: true,
      },
    ],
    [
      "closetag",
      "plain",
    ],
    [
      "closetag",
      "ns1",
    ],
    [
      "opentagstart",
      {
        name: "ns2",
        attributes: {},
        ns: {},
      },
    ],
    [
      "opentag",
      {
        name: "ns2",
        prefix: "",
        local: "ns2",
        uri: "",
        attributes: {
          "xmlns:a": {
            name: "xmlns:a",
            value: "uri:nsa",
            prefix: "xmlns",
            local: "a",
            uri: "http://www.w3.org/2000/xmlns/",
          },
        },
        ns: {
          a: "uri:nsa",
        },
        isSelfClosing: false,
      },
    ],
    [
      "opentagstart",
      {
        name: "plain",
        attributes: {},
        ns: {},
      },
    ],
    [
      "opentag",
      {
        name: "plain",
        prefix: "",
        local: "plain",
        uri: "",
        attributes: {
          attr: {
            name: "attr",
            value: "normal",
            prefix: "",
            local: "attr",
            uri: "",
          },
        },
        ns: {},
        isSelfClosing: true,
      },
    ],
    [
      "closetag",
      "plain",
    ],
    [
      "opentagstart",
      {
        name: "a:ns",
        attributes: {},
        ns: {},
      },
    ],
    [
      "opentag",
      {
        name: "a:ns",
        prefix: "a",
        local: "ns",
        uri: "uri:nsa",
        attributes: {
          "a:attr": {
            name: "a:attr",
            value: "namespaced",
            prefix: "a",
            local: "attr",
            uri: "uri:nsa",
          },
        },
        ns: {},
        isSelfClosing: true,
      },
    ],
    [
      "closetag",
      "a:ns",
    ],
    [
      "closetag",
      "ns2",
    ],
    [
      "closetag",
      "root",
    ],
  ],
  opt: {
    xmlns: true,
  },
});
