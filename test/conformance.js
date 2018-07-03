"use strict";

const { build } = require("xml-conformance-suite/js/frameworks/mocha/builders/basic");
const { ResourceLoader } = require("xml-conformance-suite/js/lib/resource-loader");
const { BaseDriver } = require("xml-conformance-suite/js/drivers/base");
const { Selection } = require("xml-conformance-suite/js/selections/chrome");

const saxes = require("../lib/saxes");

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
          errors.push(err);
        };

        parser.close(source);
        this.processResult(test, handling, errors.length === 0);
      });
  }
}

build(new ResourceLoader(), SaxesDriver, Selection).then(run);
