"use strict";

// https://github.com/isaacs/sax-js/issues/124
require(".").test({
  xml: "<!-- stand alone comment -->",
  expect: [
    [
      "comment",
      " stand alone comment ",
    ],
  ],
  opt: {},
});
