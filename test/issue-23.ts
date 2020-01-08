import { test } from "./testutil";

test({
  name: "issue 23",
  xml: "<compileClassesResponse>" +
    "<result>" +
    "<bodyCrc>653724009</bodyCrc>" +
    "<column>-1</column>" +
    "<id>01pG0000002KoSUIA0</id>" +
    "<line>-1</line>" +
    "<name>CalendarController</name>" +
    "<success>true</success>" +
    "</result>" +
    "</compileClassesResponse>",
  expect: [
    ["opentagstart", { name: "compileClassesResponse", attributes: {} }],
    ["opentag",
     { name: "compileClassesResponse", attributes: {}, isSelfClosing: false }],
    ["opentagstart", { name: "result", attributes: {} }],
    ["opentag", { name: "result", attributes: {}, isSelfClosing: false }],
    ["opentagstart", { name: "bodyCrc", attributes: {} }],
    ["opentag", { name: "bodyCrc", attributes: {}, isSelfClosing: false }],
    ["text", "653724009"],
    ["closetag", { name: "bodyCrc", attributes: {}, isSelfClosing: false }],
    ["opentagstart", { name: "column", attributes: {} }],
    ["opentag", { name: "column", attributes: {}, isSelfClosing: false }],
    ["text", "-1"],
    ["closetag", { name: "column", attributes: {}, isSelfClosing: false }],
    ["opentagstart", { name: "id", attributes: {} }],
    ["opentag", { name: "id", attributes: {}, isSelfClosing: false }],
    ["text", "01pG0000002KoSUIA0"],
    ["closetag", { name: "id", attributes: {}, isSelfClosing: false }],
    ["opentagstart", { name: "line", attributes: {} }],
    ["opentag", { name: "line", attributes: {}, isSelfClosing: false }],
    ["text", "-1"],
    ["closetag", { name: "line", attributes: {}, isSelfClosing: false }],
    ["opentagstart", { name: "name", attributes: {} }],
    ["opentag", { name: "name", attributes: {}, isSelfClosing: false }],
    ["text", "CalendarController"],
    ["closetag", { name: "name", attributes: {}, isSelfClosing: false }],
    ["opentagstart", { name: "success", attributes: {} }],
    ["opentag", { name: "success", attributes: {}, isSelfClosing: false }],
    ["text", "true"],
    ["closetag", { name: "success", attributes: {}, isSelfClosing: false }],
    ["closetag", { name: "result", attributes: {}, isSelfClosing: false }],
    ["closetag",
     { name: "compileClassesResponse", attributes: {}, isSelfClosing: false }],
  ],
  opt: {},
});
