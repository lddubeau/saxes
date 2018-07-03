"use strict";

const { expect } = require("chai");
const saxes = require("../lib/saxes");

it("utf8 split", () => {
  const saxesStream = saxes.createStream();

  const b = Buffer.from("误");

  let textHandled = false;
  saxesStream.on("text", (text) => {
    expect(text).to.equal(b.toString());
    textHandled = true;
  });

  saxesStream.write(Buffer.from("<test><a>"));
  saxesStream.write(b.slice(0, 1));
  saxesStream.write(b.slice(1));
  saxesStream.write(Buffer.from("</a><b>"));
  saxesStream.write(b.slice(0, 2));
  saxesStream.write(b.slice(2));
  saxesStream.write(Buffer.from("</b><c>"));
  saxesStream.write(b);
  saxesStream.write(Buffer.from("</c>"));
  saxesStream.write(Buffer.concat([Buffer.from("<d>"), b.slice(0, 1)]));
  saxesStream.end(Buffer.concat([b.slice(1), Buffer.from("</d></test>")]));

  expect(textHandled).to.be.true;

  const saxesStream2 = saxes.createStream();

  let textHandled2 = false;
  saxesStream2.on("text", (text) => {
    expect(text).to.equal("�");
    textHandled2 = true;
  });

  saxesStream2.write(Buffer.from("<root>"));
  saxesStream2.write(Buffer.from("<e>"));
  saxesStream2.write(Buffer.from([0xC0]));
  saxesStream2.write(Buffer.from("</e>"));
  saxesStream2.write(Buffer.concat([Buffer.from("<f>"), b.slice(0, 1)]));
  saxesStream2.write(Buffer.from("</f></root>"));
  saxesStream2.end();

  expect(textHandled2).to.be.true;
});
