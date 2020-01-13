import { test } from "./testutil";

describe("dtd", () => {
  test({
    name: "DTD with comment containing a quote",
    xml: `\
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE root [
<!-- I'm a test. -->
]>
<root/>`,
    expect: [
      [
        "xmldecl",
        {
          encoding: "UTF-8",
          version: "1.0",
          standalone: undefined,
        },
      ],
      ["text", "\n"],
      ["doctype", ` root [
<!-- I'm a test. -->
]`],
      ["text", "\n"],
      ["opentagstart", { name: "root", attributes: {} }],
      ["opentag", { name: "root", attributes: {}, isSelfClosing: true }],
      ["closetag", { name: "root", attributes: {}, isSelfClosing: true }],
    ],
  });

  test({
    name: "DTD with processing instruction containing a quote",
    xml: `\
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE root [
<? I'm a test. ?>
]>
<root/>`,
    expect: [
      [
        "xmldecl",
        {
          encoding: "UTF-8",
          version: "1.0",
          standalone: undefined,
        },
      ],
      ["text", "\n"],
      ["doctype", ` root [
<? I'm a test. ?>
]`],
      ["text", "\n"],
      ["opentagstart", { name: "root", attributes: {} }],
      ["opentag", { name: "root", attributes: {}, isSelfClosing: true }],
      ["closetag", { name: "root", attributes: {}, isSelfClosing: true }],
    ],
  });

  test({
    name: "DTD with ]> in a string",
    xml: `\
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE root [
<!NOTATION not1 SYSTEM "]>">
]>
<root/>`,
    expect: [
      [
        "xmldecl",
        {
          encoding: "UTF-8",
          version: "1.0",
          standalone: undefined,
        },
      ],
      ["text", "\n"],
      ["doctype", ` root [
<!NOTATION not1 SYSTEM "]>">
]`],
      ["text", "\n"],
      ["opentagstart", { name: "root", attributes: {} }],
      ["opentag", { name: "root", attributes: {}, isSelfClosing: true }],
      ["closetag", { name: "root", attributes: {}, isSelfClosing: true }],
    ],
  });
});
