"use strict";

/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");
const saxes = require("../build/dist/saxes");

const parser = new saxes.SaxesParser();

const inspector = ev => function handler(data) {
  console.error("%s %s %j", `${parser.line}:${parser.column}`, ev, data);
};

saxes.EVENTS.forEach(ev => {
  parser.on(ev, inspector(ev));
});

parser.on("end", () => {
  console.error("end");
  console.error(parser);
});

let xml = fs.readFileSync(path.join(__dirname, "test.xml"), "utf8");
function processChunk() {
  if (xml) {
    const c = Math.ceil(Math.random() * 1000);
    parser.write(xml.substr(0, c));
    xml = xml.substr(c);
    process.nextTick(processChunk);
  }
  else {
    parser.close();
  }
}

processChunk();
