import { execFile as _execFile } from "child_process";
import * as util from "util";

import { test } from "./testutil";

const execFile = util.promisify(_execFile);

test({
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
