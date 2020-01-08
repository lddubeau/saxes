import { test } from "./testutil";

describe("processing instructions", () => {
  test({
    name: "with well-formed name",
    xml: "<?xml-stylesheet version='1.0'?><foo/>",
    expect: [
      ["processinginstruction", {
        target: "xml-stylesheet",
        body: "version='1.0'",
      }],
      ["opentagstart", {
        name: "foo",
        attributes: {},
        ns: {},
      }],
      ["opentag", {
        name: "foo",
        local: "foo",
        prefix: "",
        uri: "",
        attributes: {},
        ns: {},
        isSelfClosing: true,
      }],
      ["closetag", {
        name: "foo",
        local: "foo",
        prefix: "",
        uri: "",
        attributes: {},
        ns: {},
        isSelfClosing: true,
      }],
    ],
    opt: {
      xmlns: true,
    },
  });
});
