"use strict";

const { build } = require("xml-conformance-suite/js/frameworks/mocha/builders/basic");
const { ResourceLoader } = require("xml-conformance-suite/js/lib/resource-loader");
const { BaseDriver } = require("xml-conformance-suite/js/drivers/base");
const { Selection } = require("xml-conformance-suite/js/selections/chrome");

const saxes = require("../lib/saxes");

const SKIP = {
  "rmt-ns10-043": "DTD",
  "rmt-ns10-044": "DTD",
  "rmt-e3e-06i": "DTD",
  "rmt-e3e-12": "DTD",
};

class SaxesSelection extends Selection {
  shouldSkipTest(test) {
    return Promise.resolve()
      .then(() => SKIP[test.id] || super.shouldSkipTest(test));
  }
}

class SaxesDriver extends BaseDriver {
  constructor(resourceLoader) {
    super();
    /** @private */
    this.resourceLoader = resourceLoader;

    this.processesExternalEntities = false;
    this.canValidate = false;
  }

  run(test, handling) {
    const { resolvedURI } = test;
    return this.resourceLoader.loadFile(resolvedURI)
      .then((source) => {
        const errors = [];
        const parser = saxes.parser({
          xmlns: !test.forbidsNamespaces,
        });
        parser.onerror = (err) => {
          if (typeof process !== "undefined" && process.env &&
              process.env.DEBUG) {
            console.log(err);
          }
          errors.push(err);
        };

        parser.write(source);
        parser.end();
        this.processResult(test, handling, errors.length === 0);
      });
  }
}

build(new ResourceLoader(), SaxesDriver, SaxesSelection).then(run);
