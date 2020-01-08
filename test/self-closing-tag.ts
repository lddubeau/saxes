import { test } from "./testutil";

test({
  name: "self-closing tag",
  xml: "<root>   " +
    "<haha /> " +
    "<haha/>  " +
    "<monkey> " +
    "=(|)     " +
    "</monkey>" +
    "</root>  ",
  expect: [
    ["opentagstart", { name: "root", attributes: {} }],
    ["opentag", { name: "root", attributes: {}, isSelfClosing: false }],
    ["text", "   "],
    ["opentagstart", { name: "haha", attributes: {} }],
    ["opentag", { name: "haha", attributes: {}, isSelfClosing: true }],
    ["closetag", { name: "haha", attributes: {}, isSelfClosing: true }],
    ["text", " "],
    ["opentagstart", { name: "haha", attributes: {} }],
    ["opentag", { name: "haha", attributes: {}, isSelfClosing: true }],
    ["closetag", { name: "haha", attributes: {}, isSelfClosing: true }],
    ["text", "  "],
    // ["opentag", {name:"haha", attributes:{}}],
    // ["closetag", "haha"],
    ["opentagstart", { name: "monkey", attributes: {} }],
    ["opentag", { name: "monkey", attributes: {}, isSelfClosing: false }],
    ["text", " =(|)     "],
    ["closetag", { name: "monkey", attributes: {}, isSelfClosing: false }],
    ["closetag", { name: "root", attributes: {}, isSelfClosing: false }],
    ["text", "  "],
  ],
  opt: {},
});
