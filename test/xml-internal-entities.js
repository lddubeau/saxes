"use strict";

// generates xml like test0="&control;"
const entitiesToTest = {
  // 'ENTITY_NAME': IS_VALID || invalidCharPos,
  control0: true, // This is a vanilla control.
  // entityStart
  _uscore: true,
  "#hash": false,
  ":colon": true,
  "-bad": false,
  ".bad": false,
  // general entity
  u_score: true,
  "d-ash": true,
  "d.ot": true,
  "all:_#-.": false,
};

let xmlStart = "<a test=\"&amp;\" ";
const myAttributes = {};
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

  if (!entitiesToTest[entity]) {
    const pos = xmlStart.length + entity.length + 1;

    attributeErrors.push([
      "error",
      `undefined:1:${pos}: ${entity[0] === "#" ? "malformed character entity." :
"disallowed character in entity name."}`,
    ]);
    myAttributes[attribName] = `&${entity};`;
  }
  else {
    ENTITIES[entity] = attribValue;
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
    [
      "opentag",
      {
        name: "a",
        attributes: myAttributes,
        isSelfClosing: true,
      },
    ],
    [
      "closetag",
      {
        name: "a",
        attributes: myAttributes,
        isSelfClosing: true,
      },
    ],
  ],
  fn(parser) {
    Object.assign(parser.ENTITIES, ENTITIES);
    parser.write(`${xmlStart}/>`).close();
  },
});
