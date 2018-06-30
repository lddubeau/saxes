"use strict";

const parser = require("../").parser(true);
const t = require("tap");

t.plan(1);
parser.onopentag = function onopentag(node) {
  t.same(node, { name: "x", attributes: {}, isSelfClosing: false });
};
const xml = Buffer.from("<x>y</x>");
parser.write(xml).close();
