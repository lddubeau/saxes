"use strict";

require(".").test({
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
    ["closetag", "haha"],
    ["text", " "],
    ["opentagstart", { name: "haha", attributes: {} }],
    ["opentag", { name: "haha", attributes: {}, isSelfClosing: true }],
    ["closetag", "haha"],
    ["text", "  "],
    // ["opentag", {name:"haha", attributes:{}}],
    // ["closetag", "haha"],
    ["opentagstart", { name: "monkey", attributes: {} }],
    ["opentag", { name: "monkey", attributes: {}, isSelfClosing: false }],
    ["text", " =(|)     "],
    ["closetag", "monkey"],
    ["closetag", "root"],
    ["text", "  "],
  ],
  opt: {},
});
