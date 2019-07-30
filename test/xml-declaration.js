"use strict";

const { expect } = require("chai");
const saxes = require("../lib/saxes");
const { test } = require(".");

const XML_1_0_DECLARATION = `<?xml version="1.0"?>`;
const XML_1_1_DECLARATION = `<?xml version="1.1"?>`;

const WELL_FORMED_1_0_NOT_1_1 = `<root>\u007F</root>`;
const WELL_FORMED_1_1_NOT_1_0 = `<root>&#1;</root>`;

describe("xml declaration", () => {
  test({
    name: "empty declaration",
    xml: "<?xml?><root/>",
    expect: [
      ["error", "1:7: XML declaration must contain a version."],
      ["opentagstart", { name: "root", attributes: {}, ns: {} }],
      [
        "opentag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
      [
        "closetag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
    ],
    opt: {
      xmlns: true,
    },
  });

  test({
    name: "version without value",
    xml: "<?xml version?><root/>",
    expect: [
      ["error", "1:15: XML declaration is incomplete."],
      ["opentagstart", { name: "root", attributes: {}, ns: {} }],
      [
        "opentag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
      [
        "closetag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
    ],
    opt: {
      xmlns: true,
    },
  });

  test({
    name: "version without value",
    xml: "<?xml version=?><root/>",
    expect: [
      ["error", "1:16: XML declaration is incomplete."],
      ["opentagstart", { name: "root", attributes: {}, ns: {} }],
      [
        "opentag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
      [
        "closetag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
    ],
    opt: {
      xmlns: true,
    },
  });

  test({
    name: "unquoted value",
    xml: "<?xml version=a?><root/>",
    expect: [
      ["error", "1:15: value must be quoted."],
      ["error", "1:17: XML declaration is incomplete."],
      ["opentagstart", { name: "root", attributes: {}, ns: {} }],
      [
        "opentag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
      [
        "closetag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
    ],
    opt: {
      xmlns: true,
    },
  });

  test({
    name: "unterminated value",
    xml: "<?xml version=\"a?><root/>",
    expect: [
      ["error", "1:18: XML declaration is incomplete."],
      ["opentagstart", { name: "root", attributes: {}, ns: {} }],
      [
        "opentag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
      [
        "closetag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
    ],
    opt: {
      xmlns: true,
    },
  });

  test({
    name: "bad version",
    xml: "<?xml version=\"a\"?><root/>",
    expect: [
      ["error", "1:17: version number must match /^1\\.[0-9]+$/."],
      ["opentagstart", { name: "root", attributes: {}, ns: {} }],
      [
        "opentag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
      [
        "closetag",
        {
          name: "root",
          prefix: "",
          local: "root",
          uri: "",
          attributes: {},
          ns: {},
          isSelfClosing: true,
        },
      ],
    ],
    opt: {
      xmlns: true,
    },
  });

  it("well-formed", () => {
    const parser = new saxes.SaxesParser();
    let seen = false;
    parser.onopentagstart = () => {
      expect(parser.xmlDecl).to.deep.equal({
        version: "1.1",
        encoding: "utf-8",
        standalone: "yes",
      });
      seen = true;
    };
    parser.write(
      "<?xml version=\"1.1\" encoding=\"utf-8\" standalone=\"yes\"?><root/>");
    parser.close();
    expect(seen).to.be.true;
  });

  function parse(source, options) {
    const parser = new saxes.SaxesParser(options);
    let error = false;
    parser.onerror = () => {
      error = true;
    };
    parser.write(source);
    parser.close();
    return error;
  }

  function makeDefaultXMLVersionTests(groupName, xmlDeclaration, document,
                                      expecteUnforcedResults,
                                      expectedForcedResults) {
    describe(groupName, () => {
      for (const { version, expectError } of expecteUnforcedResults) {
        const errorLabel = expectError ? "errors" : "no errors";
        const title = version === undefined ?
              `and without defaultXMLVersion: ${errorLabel}` :
              `and with defaultXMLVersion === ${version}: ${errorLabel}`;

        it(title, () => {
          expect(parse(xmlDeclaration + document,
                       version === undefined ? undefined :
                       { defaultXMLVersion: version })).to.equal(expectError);
        });
      }

      if (xmlDeclaration !== "") {
        for (const { version, expectError } of expectedForcedResults) {
          const errorLabel = expectError ? "errors" : "no errors";
          it(`and with forced xml version ${version}: ${errorLabel}`, () => {
            expect(parse(xmlDeclaration + document, {
              defaultXMLVersion: version,
              forceXMLVersion: true,
            })).to.equal(expectError);
          });
        }
      }
    });
  }

  describe("document well-formed for 1.0, not 1.1", () => {
    makeDefaultXMLVersionTests("without XML declaration", "",
                               WELL_FORMED_1_0_NOT_1_1, [{
                                 version: undefined,
                                 expectError: false,
                               }, {
                                 version: "1.0",
                                 expectError: false,
                               }, {
                                 version: "1.1",
                                 expectError: true,
                               }]);

    makeDefaultXMLVersionTests("with XML 1.0 declaration", XML_1_0_DECLARATION,
                               WELL_FORMED_1_0_NOT_1_1, [{
                                 version: undefined,
                                 expectError: false,
                               }, {
                                 version: "1.0",
                                 expectError: false,
                               }, {
                                 version: "1.1",
                                 // The XML declaration overrides
                                 // defaultXMLVersion.
                                 expectError: false,
                               }], [{
                                 version: "1.0",
                                 expectError: false,
                               }, {
                                 version: "1.1",
                                 expectError: true,
                               }]);

    makeDefaultXMLVersionTests("with XML 1.1 declaration", XML_1_1_DECLARATION,
                               WELL_FORMED_1_0_NOT_1_1, [{
                                 version: undefined,
                                 // The XML declaration overrides
                                 // defaultXMLVersion.
                                 expectError: true,
                               }, {
                                 version: "1.0",
                                 // The XML declaration overrides
                                 // defaultXMLVersion.
                                 expectError: true,
                               }, {
                                 version: "1.1",
                                 expectError: true,
                               }], [{
                                 version: "1.0",
                                 expectError: false,
                               }, {
                                 version: "1.1",
                                 expectError: true,
                               }]);
  });

  describe("document well-formed for 1.1, not 1.0", () => {
    makeDefaultXMLVersionTests("without XML declaration", "",
                               WELL_FORMED_1_1_NOT_1_0, [{
                                 version: undefined,
                                 expectError: true,
                               }, {
                                 version: "1.0",
                                 expectError: true,
                               }, {
                                 version: "1.1",
                                 expectError: false,
                               }]);

    makeDefaultXMLVersionTests("with XML 1.0 declaration",
                               XML_1_0_DECLARATION,
                               WELL_FORMED_1_1_NOT_1_0, [{
                                 version: undefined,
                                 expectError: true,
                               }, {
                                 version: "1.0",
                                 expectError: true,
                               }, {
                                 version: "1.1",
                                 // The XML declaration overrides
                                 // defaultXMLVersion.
                                 expectError: true,
                               }], [{
                                 version: "1.0",
                                 expectError: true,
                               }, {
                                 version: "1.1",
                                 expectError: false,
                               }]);

    makeDefaultXMLVersionTests("with XML 1.1 declaration",
                               XML_1_1_DECLARATION,
                               WELL_FORMED_1_1_NOT_1_0, [{
                                 version: undefined,
                                 // The XML declaration overrides
                                 // defaultXMLVersion.
                                 expectError: false,
                               }, {
                                 version: "1.0",
                                 // The XML declaration overrides
                                 // defaultXMLVersion.
                                 expectError: false,
                               }, {
                                 version: "1.1",
                                 expectError: false,
                               }], [{
                                 version: "1.0",
                                 expectError: true,
                               }, {
                                 version: "1.1",
                                 expectError: false,
                               }]);
  });
});
