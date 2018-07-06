"use strict";

const { expect } = require("chai");
const saxes = require("../lib/saxes");

it("end empty stream", () => {
  const saxesStream = saxes.createStream();
  // It musn't throw.
  expect(() => saxesStream.end()).to.throw(
    Error,
    /^undefined:1:0: document must contain a root element.$/);
});
