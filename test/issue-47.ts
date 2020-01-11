import { test } from "./testutil";

// https://github.com/isaacs/sax-js/issues/47
test({
  name: "issue 47",
  xml: "<a href=\"query.svc?x=1&amp;y=2&amp;z=3\"/>",
  expect: [
    ["opentagstart", { name: "a", attributes: {} }],
    ["attribute", { name: "href", value: "query.svc?x=1&y=2&z=3" }],
    ["opentag", {
      name: "a",
      attributes: { href: "query.svc?x=1&y=2&z=3" },
      isSelfClosing: true,
    }],
    ["closetag", {
      name: "a",
      attributes: { href: "query.svc?x=1&y=2&z=3" },
      isSelfClosing: true,
    }],
  ],
  opt: {},
});
