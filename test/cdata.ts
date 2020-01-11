import { test } from "./testutil";

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
    ["attribute", { name: "foo", value: "]]>" }],
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

test({
  name: "surrounded by whitespace",
  expect: [
    ["opentagstart", { name: "content:encoded", attributes: {} }],
    ["opentag", {
      name: "content:encoded",
      attributes: {},
      isSelfClosing: false,
    }],
    ["text", "\n          "],
    ["cdata", "spacetime is four dimensional"],
    ["text", "\n  "],
    ["closetag", {
      name: "content:encoded",
      attributes: {},
      isSelfClosing: false,
    }],
  ],
  xml: `<content:encoded>
          <![CDATA[spacetime is four dimensional]]>
  </content:encoded>`,
});
