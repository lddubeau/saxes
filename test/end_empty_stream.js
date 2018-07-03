"use strict";

const saxes = require("../lib/saxes");

it("end empty stream", () => {
  const saxesStream = saxes.createStream();
  // It musn't throw.
  saxesStream.end();
});
