"use strict";

const fs = require("fs");
const saxes = require("../lib/saxes");

const xml = fs.readFileSync(process.argv[2]);
const start = Date.now();
const parser = new saxes.SaxesParser({ xmlns: true });

parser.onerror = (err) => {
  console.error(err);
};

parser.write(xml);
parser.close();
console.log(`Parsing time: ${Date.now() - start}`);
