"use strict";

/* eslint-disable no-console */

const fs = require("fs");
const saxes = require("../build/dist/saxes");

const { argv } = process;
let bs;
const first = argv[2];
let filePath = first;
if (first.startsWith("--bs=")) {
  bs = Number(first.substring(first.indexOf("=") + 1));
  if (Number.isNaN(bs)) {
    throw new Error("bs is not a number");
  }
  // eslint-disable-next-line prefer-destructuring
  filePath = argv[3];
}

if (bs === undefined) {
  const xml = fs.readFileSync(filePath);
  const start = Date.now();
  const parser = new saxes.SaxesParser({ xmlns: true });
  parser.on("error", err => {
    console.error(err);
  });

  parser.write(xml);
  parser.close();
  console.log(`Parsing time: ${Date.now() - start}`);
}
else {
  const input = fs.createReadStream(filePath);
  const start = Date.now();
  const parser = new saxes.SaxesParser({ xmlns: true });
  parser.on("error", err => {
    console.error(err);
  });

  input.on("readable", () => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const chunk = input.read(bs);
      if (chunk === null) {
        return;
      }

      parser.write(chunk);
    }
  });

  input.on("end", () => {
    parser.close();
    console.log(`Parsing time: ${Date.now() - start}`);
  });
}
