import { test } from "./testutil";

test({
  name: "self-closing child",
  xml: "<root>" +
    "<child>" +
    "<haha />" +
    "</child>" +
    "<monkey>" +
    "=(|)" +
    "</monkey>" +
    "</root>",
  expect: [
    ["opentagstart", {
      name: "root",
      attributes: {},
    }],
    ["opentag", {
      name: "root",
      attributes: {},
      isSelfClosing: false,
    }],
    ["opentagstart", {
      name: "child",
      attributes: {},
    }],
    ["opentag", {
      name: "child",
      attributes: {},
      isSelfClosing: false,
    }],
    ["opentagstart", {
      name: "haha",
      attributes: {},
    }],
    ["opentag", {
      name: "haha",
      attributes: {},
      isSelfClosing: true,
    }],
    ["closetag", {
      name: "haha",
      attributes: {},
      isSelfClosing: true,
    }],
    ["closetag", {
      name: "child",
      attributes: {},
      isSelfClosing: false,
    }],
    ["opentagstart", {
      name: "monkey",
      attributes: {},
    }],
    ["opentag", {
      name: "monkey",
      attributes: {},
      isSelfClosing: false,
    }],
    ["text", "=(|)"],
    ["closetag", {
      name: "monkey",
      attributes: {},
      isSelfClosing: false,
    }],
    ["closetag", {
      name: "root",
      attributes: {},
      isSelfClosing: false,
    }],
    ["end", undefined],
    ["ready", undefined],
  ],
  opt: {},
});
