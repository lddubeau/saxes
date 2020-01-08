import { test } from "./testutil";

// These are tests that are candidates to be added to the XML conformance suite,
// after confirmation that they really plug a hole in the suite.

test({
  name: "bad pi target starting character",
  // The first character of the processing instruction is wrong. Testing the
  // first character matters because the restrictions on this character are more
  // stringent than on later characters of the name. Code writers are liable to
  // forget that the first character needs special treatment.
  xml: "<?-abcde?><root/>",
  expect: [
    ["error", "1:3: disallowed character in processing instruction name."],
    ["processinginstruction", { target: "-abcde", body: "" }],
    ["opentagstart", { name: "root", attributes: {}, ns: {} }],
    [
      "opentag",
      {
        name: "root",
        prefix: "",
        local: "root",
        uri: "",
        attributes: {},
        ns: {},
        isSelfClosing: true,
      },
    ],
    [
      "closetag",
      {
        name: "root",
        prefix: "",
        local: "root",
        uri: "",
        attributes: {},
        ns: {},
        isSelfClosing: true,
      },
    ],
  ],
  opt: {
    xmlns: true,
  },
});
