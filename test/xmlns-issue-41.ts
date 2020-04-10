import { test } from "./testutil";

const expect = [
  ["opentagstart", { name: "parent", attributes: {}, ns: {} }],
  [
    "attribute",
    {
      name: "xmlns:a",
      local: "a",
      prefix: "xmlns",
      value: "http://ATTRIBUTE",
    },
  ],
  [
    "attribute",
    {
      name: "a:attr",
      local: "attr",
      prefix: "a",
      value: "value",
    },
  ],
  [
    "opentag",
    {
      name: "parent",
      uri: "",
      prefix: "",
      local: "parent",
      attributes: {
        "a:attr": {
          name: "a:attr",
          local: "attr",
          prefix: "a",
          uri: "http://ATTRIBUTE",
          value: "value",
        },
        "xmlns:a": {
          name: "xmlns:a",
          local: "a",
          prefix: "xmlns",
          uri: "http://www.w3.org/2000/xmlns/",
          value: "http://ATTRIBUTE",
        },
      },
      ns: {
        a: "http://ATTRIBUTE",
      },
      isSelfClosing: true,
    },
  ],
  [
    "closetag",
    {
      name: "parent",
      uri: "",
      prefix: "",
      local: "parent",
      attributes: {
        "a:attr": {
          name: "a:attr",
          local: "attr",
          prefix: "a",
          uri: "http://ATTRIBUTE",
          value: "value",
        },
        "xmlns:a": {
          name: "xmlns:a",
          local: "a",
          prefix: "xmlns",
          uri: "http://www.w3.org/2000/xmlns/",
          value: "http://ATTRIBUTE",
        },
      },
      ns: {
        a: "http://ATTRIBUTE",
      },
      isSelfClosing: true,
    },
  ],
];

// should be the same both ways.
const xmls = [
  "<parent xmlns:a=\"http://ATTRIBUTE\" a:attr=\"value\" />",
  "<parent a:attr=\"value\" xmlns:a=\"http://ATTRIBUTE\" />",
];
// Take the first expect array and create a new one with elements at indexes 1
// and 2 swapped.
const expect2 = expect.slice();
const tmp = expect2[1];
// eslint-disable-next-line prefer-destructuring
expect2[1] = expect2[2];
expect2[2] = tmp;
const expects = [
  expect,
  expect2,
];
describe("issue 41", () => {
  xmls.forEach((x, i) => {
    test({
      name: `order ${i}`,
      xml: x,
      expect: expects[i],
      opt: {
        xmlns: true,
      },
    });
  });
});
