import { test } from "./testutil";

// should give an error, but still parse
test({
  name: "attributes without a space",
  xml: "<root attr1=\"first\"attr2=\"second\"/>",
  expect: [
    ["opentagstart", { name: "root", attributes: {} }],
    ["attribute", {
      name: "attr1",
      value: "first",
    }],
    ["error", "1:20: no whitespace between attributes."],
    ["attribute", {
      name: "attr2",
      value: "second",
    }],
    ["opentag", {
      name: "root",
      attributes: {
        attr1: "first",
        attr2: "second",
      },
      isSelfClosing: true,
    }],
    ["closetag", {
      name: "root",
      attributes: {
        attr1: "first",
        attr2: "second",
      },
      isSelfClosing: true,
    }],
  ],
});

// other cases should still pass
test({
  name: "attributes separated by a space",
  xml: "<root attr1=\"first\" attr2=\"second\"/>",
  expect: [
    ["opentagstart", {
      name: "root",
      attributes: {},
    }],
    ["attribute", {
      name: "attr1",
      value: "first",
    }],
    ["attribute", {
      name: "attr2",
      value: "second",
    }],
    ["opentag", {
      name: "root",
      attributes: {
        attr1: "first",
        attr2: "second",
      },
      isSelfClosing: true,
    }],
    ["closetag", {
      name: "root",
      attributes: {
        attr1: "first",
        attr2: "second",
      },
      isSelfClosing: true,
    }],
  ],
});

// other cases should still pass
test({
  name: "attributes separated by a newline",
  xml: "<root attr1=\"first\"\nattr2=\"second\"/>",
  expect: [
    ["opentagstart", {
      name: "root",
      attributes: {},
    }],
    ["attribute", {
      name: "attr1",
      value: "first",
    }],
    ["attribute", {
      name: "attr2",
      value: "second",
    }],
    ["opentag", {
      name: "root",
      attributes: {
        attr1: "first",
        attr2: "second",
      },
      isSelfClosing: true,
    }],
    ["closetag", {
      name: "root",
      attributes: {
        attr1: "first",
        attr2: "second",
      },
      isSelfClosing: true,
    }],
  ],
});

// other cases should still pass
test({
  name: "attributes separated by spaces",
  xml: "<root attr1=\"first\"  attr2=\"second\"/>",
  expect: [
    ["opentagstart", {
      name: "root",
      attributes: {},
    }],
    ["attribute", {
      name: "attr1",
      value: "first",
    }],
    ["attribute", {
      name: "attr2",
      value: "second",
    }],
    ["opentag", {
      name: "root",
      attributes: {
        attr1: "first",
        attr2: "second",
      },
      isSelfClosing: true,
    }],
    ["closetag", {
      name: "root",
      attributes: {
        attr1: "first",
        attr2: "second",
      },
      isSelfClosing: true,
    }],
  ],
});
