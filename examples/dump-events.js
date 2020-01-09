"use strict";

/* eslint-disable no-console */

const fs = require("fs");
const saxes = require("../build/dist/saxes");

const xml = fs.readFileSync(process.argv[2]);
const start = Date.now();
const parser = new saxes.SaxesParser({ xmlns: true });

for (const ev of saxes.EVENTS) {
  parser.on(ev, console.log.bind(console.log, ev));
}

parser.on("error", err => {
  console.error(err);
});

parser.write(xml);
parser.close();
console.log(`Parsing time: ${Date.now() - start}`);
