import { test } from "./testutil";

test({
  name: "issue 38",
  xml: `\
<?xml version="1.0" encoding="UTF-8"?>
<top>
<x>Fnord '&lt;' and then some.</x>
<x x="foo"></x>
</top>
`,
  expect: [
    ["opentag", { name: "top", attributes: {}, isSelfClosing: false }],
    ["opentag", { name: "x", attributes: {}, isSelfClosing: false }],
    ["opentag", { name: "x", attributes: { x: "foo" }, isSelfClosing: false }],
  ],
  opt: {},
  events: ["opentag"],
});
