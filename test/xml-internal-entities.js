"use strict";

// generates xml like test0="&control;"
const entitiesToTest = {
  // 'ENTITY_NAME': IS_VALID || [invalidCharPos, invalidChar],
  control0: true, // This is a vanilla control.
  // entityStart
  _uscore: true,
  "#hash": true,
  ":colon": true,
  "-bad": [0, "-"],
  ".bad": [0, "."],
  // general entity
  u_score: true,
  "d-ash": true,
  "d.ot": true,
  "all:_#-.": [5, "#"],
};

let xmlStart = "<a test=\"&amp;\" ";
const myAttributes = {};
const attributeEvents = [[
  "attribute",
  {
    name: "test",
    value: "&",
  },
]];
myAttributes.test = "&";

let entI = 0;

const attributeErrors = [];
const ENTITIES = {};
// eslint-disable-next-line guard-for-in
for (const entity in entitiesToTest) {
  const attribName = `test${entI}`;
  const attribValue = `Testing ${entity}`;

  // add the first part to use in calculation below
  xmlStart += `${attribName}="&`;

  if (typeof entitiesToTest[entity] === "object") {
    attributeErrors.push([
      "error",
      `undefined:1:${xmlStart.length + entitiesToTest[entity][0] + 1}: disallowed \
character in entity name.`,
    ]);
    attributeEvents.push([
      "attribute",
      { name: attribName, value: `&${entity};` },
    ]);
    myAttributes[attribName] = `&${entity};`;
  }
  else {
    ENTITIES[entity] = attribValue;
    attributeEvents.push(["attribute",
                          { name: attribName, value: attribValue }]);
    myAttributes[attribName] = attribValue;
  }

  xmlStart += `${entity};" `;
  entI++;
}

require(".").test({
  name: "xml internal entities",
  expect: [
    [
      "opentagstart",
      {
        name: "a",
        attributes: {},
      },
    ],
    ...attributeErrors,
    ...attributeEvents,
    [
      "opentag",
      {
        name: "a",
        attributes: myAttributes,
        isSelfClosing: true,
      },
    ],
    ["closetag", "a"],
  ],
  fn(parser) {
    Object.assign(parser.ENTITIES, ENTITIES);
    parser.write(`${xmlStart}/>`).close();
  },
});
