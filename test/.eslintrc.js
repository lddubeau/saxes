module.exports = {
  extends: "../.eslintrc.js",
  env: {
    mocha: true,
  },
  rules: {
    "no-unused-expressions":
    ["off", "Lots of false positivites due to chai."],
  }
}
