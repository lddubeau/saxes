import { test } from "./testutil";

test({
  name: "unclosed root",
  xml: "<root>",
  expect: [
    [
      "opentagstart",
      {
        name: "root",
        attributes: {},
      },
    ],
    [
      "opentag",
      {
        name: "root",
        attributes: {},
        isSelfClosing: false,
      },
    ],
    [
      "error",
      "1:6: unclosed tag: root",
    ],
  ],
  opt: {},
});
