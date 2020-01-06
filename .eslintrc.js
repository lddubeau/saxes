module.exports = {
  extends: [
    "lddubeau-base",
  ],
  env: {
    node: true,
  },
  overrides: [{
    files: [
      "lib/**/*.js",
    ],
    rules: {
      "no-continue": "off",
      // We use constant conditions quite often, for optimization reasons.
      "no-constant-condition": "off",
    },
  }, {
    files: [
      "test/**/*.js",
    ],
    env: {
      mocha: true,
    },
    rules: {
      "no-unused-expressions":
      ["off", "Lots of false positivites due to chai."],
    },
  },{
    files: [
      "misc/**/*.js",
    ],
    env: {
      browser: true,
      node: false,
    },
  }],
};
