module.exports = {
  extends: "../.eslintrc.js",
  rules: {
    "no-continue": "off",
    // We use constant conditions quite often, for optimization reasons.
    "no-constant-condition": "off",
  },
}
