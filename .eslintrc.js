module.exports = {
  overrides: [{
    files: [
      "**/*.js",
    ],
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
  }, {
    files: [
      "**/*.ts",
    ],
    env: {
      node: true,
    },
    extends: [
      "eslint:recommended",
      "eslint-config-lddubeau-ts",
    ],
    rules: {
      "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
      "import/extensions": ["error", "always", {
        js: "never",
        ts: "never",
      }],
      // Too useful in this code-base.
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  }],
};
