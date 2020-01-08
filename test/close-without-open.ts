import { test } from "./testutil";

test({
  name: "close a tag that was not opened",
  xml: "</root>",
  expect: [
    ["error", "1:7: unmatched closing tag: root."],
    ["error", "1:7: document must contain a root element."],
    ["text", "</root>"],
  ],
  opt: {
    xmlns: true,
  },
});
