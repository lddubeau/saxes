"use strict";

const tap = require("tap");
const saxesStream = require("../lib/saxes").createStream();

const b = Buffer.from("误");

saxesStream.on("text", (text) => {
  tap.equal(text, b.toString());
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

const saxesStream2 = require("../lib/saxes").createStream();

saxesStream2.on("text", (text) => {
  tap.equal(text, "�");
});

saxesStream2.write(Buffer.from("<root>"));
saxesStream2.write(Buffer.from("<e>"));
saxesStream2.write(Buffer.from([0xC0]));
saxesStream2.write(Buffer.from("</e>"));
saxesStream2.write(Buffer.concat([Buffer.from("<f>"), b.slice(0, 1)]));
saxesStream2.write(Buffer.from("</f></root>"));
saxesStream2.end();
