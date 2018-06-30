"use strict";

const p = require(".").test({
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["opencdata", undefined],
    ["cdata", "[[[[[[[[]]]]]]]]"],
    ["closecdata", undefined],
    ["closetag", "r"],
  ],
});

let x = "<r><![CDATA[[[[[[[[[]]]]]]]]]]></r>";
for (let i = 0; i < x.length; i++) {
  p.write(x.charAt(i));
}
p.close();

const p2 = require(".").test({
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["opencdata", undefined],
    ["cdata", "[[[[[[[[]]]]]]]]"],
    ["closecdata", undefined],
    ["closetag", "r"],
  ],
});

x = "<r><![CDATA[[[[[[[[[]]]]]]]]]]></r>";
p2.write(x).close();
