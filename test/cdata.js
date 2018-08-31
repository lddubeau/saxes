"use strict";

const { test } = require(".");

test({
  name: "cdata",
  xml: "<r><![CDATA[ this is character data  ]]><![CDATA[]]></r>",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["cdata", " this is character data  "],
    ["cdata", ""],
    ["closetag", { name: "r", attributes: {}, isSelfClosing: false }],
  ],
});

test({
  name: "cdata end in attribute",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", {
      name: "r",
      attributes: {
        foo: "]]>",
      },
      isSelfClosing: true,
    }],
    ["closetag", {
      name: "r",
      attributes: {
        foo: "]]>",
      },
      isSelfClosing: true,
    }],
  ],
  xml: "<r foo=']]>'/>",
});
