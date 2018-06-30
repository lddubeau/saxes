"use strict";

const tap = require("tap");
const saxesStream = require("../lib/saxes").createStream();

tap.doesNotThrow(() => {
  saxesStream.end();
});
