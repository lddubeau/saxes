import { SaxesParser } from "../build/dist/saxes";
import { test } from "./testutil";

// generates xml like test0="&control;"
const entitiesToTest: Record<string, boolean> = {
  // 'ENTITY_NAME': IS_VALID || invalidCharPos,
  "control0": true, // This is a vanilla control.
  // entityStart
  "_uscore": true,
  "#hash": false,
  ":colon": true,
  "-bad": false,
  ".bad": false,
  // general entity
  "u_score": true,
  "d-ash": true,
  "d.ot": true,
  "all:_#-.": false,
};

let xmlStart = "<a test=\"&amp;\" ";
const myAttributes: Record<string, string> = {};
myAttributes.test = "&";

let entI = 0;

const attributeErrors = [];
const ENTITIES: Record<string, string> = {};
// eslint-disable-next-line guard-for-in
for (const entity in entitiesToTest) {
  const attribName = `test${entI}`;
  const attribValue = `Testing ${entity}`;

  // add the first part to use in calculation below
  xmlStart += `${attribName}="&`;

  if (!entitiesToTest[entity]) {
    const pos = xmlStart.length + entity.length + 1;

    const msg = entity[0] === "#" ? "malformed character entity." :
      "disallowed character in entity name.";
    attributeErrors.push(["error", `1:${pos}: ${msg}`]);
    myAttributes[attribName] = `&${entity};`;
  }
  else {
    ENTITIES[entity] = attribValue;
    myAttributes[attribName] = attribValue;
  }

  xmlStart += `${entity};" `;
  entI++;
}

test({
  name: "xml internal entities",
  expect: [
    ...attributeErrors,
  ],
  // We only care about errrors for this test.
  events: ["error"],
  fn(parser: SaxesParser): void {
    Object.assign(parser.ENTITIES, ENTITIES);
    parser.write(`${xmlStart}/>`).close();
  },
});
