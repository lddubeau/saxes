"use strict";

const { execFile: _execFile } = require("child_process");
const util = require("util");

const execFile = util.promisify(_execFile);

require(".").test({
  name: "entities",
  xml: "<r>&amp; &lt; &gt; ></r>",
  expect: [
    ["opentagstart", { name: "r", attributes: {} }],
    ["opentag", { name: "r", attributes: {}, isSelfClosing: false }],
    ["text", "& < > >"],
    ["closetag", { name: "r", attributes: {}, isSelfClosing: false }],
  ],
});

// This test mainly exists to check parsing speed of a file with a lot of
// entities.
it("mass entities", async () => {
  await execFile("node", ["./examples/null-parser.js",
                          "test/files/entities.xml"]);
});
