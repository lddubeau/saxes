import { test } from "./testutil";

const expect = [
  ["opentagstart", { name: "parent", attributes: {}, ns: {} }],
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
          // eslint-disable-next-line @typescript-eslint/tslint/config
          uri: "http://ATTRIBUTE",
          value: "value",
        },
        "xmlns:a": {
          name: "xmlns:a",
          local: "a",
          prefix: "xmlns",
          // eslint-disable-next-line @typescript-eslint/tslint/config
          uri: "http://www.w3.org/2000/xmlns/",
          // eslint-disable-next-line @typescript-eslint/tslint/config
          value: "http://ATTRIBUTE",
        },
      },
      ns: {
        // eslint-disable-next-line @typescript-eslint/tslint/config
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
          // eslint-disable-next-line @typescript-eslint/tslint/config
          uri: "http://ATTRIBUTE",
          value: "value",
        },
        "xmlns:a": {
          name: "xmlns:a",
          local: "a",
          prefix: "xmlns",
          // eslint-disable-next-line @typescript-eslint/tslint/config
          uri: "http://www.w3.org/2000/xmlns/",
          // eslint-disable-next-line @typescript-eslint/tslint/config
          value: "http://ATTRIBUTE",
        },
      },
      ns: {
        // eslint-disable-next-line @typescript-eslint/tslint/config
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
describe("issue 41", () => {
  xmls.forEach((x, i) => {
    test({
      name: `order ${i}`,
      xml: x,
      expect,
      opt: {
        xmlns: true,
      },
    });
  });
});
