"use strict";

const { build } = require("xml-conformance-suite/js/frameworks/mocha/builders/basic");
const { ResourceLoader } = require("xml-conformance-suite/js/lib/resource-loader");
const { BaseDriver } = require("xml-conformance-suite/js/drivers/base");
const { Selection } = require("xml-conformance-suite/js/selections/chrome");

const saxes = require("../lib/saxes");

//
// ENTITIES: this test requires parsing ENTITY declrations in DTDs,
// which we don't support yet.
//
// DTD: this test requires reporting wf errors in a DTD, which we
// don't support yet.
//

const SKIP = {
  "ibm-not-wf-P68-ibm68n07.xml": "DTD",
  "ibm-not-wf-P69-ibm69n01.xml": "DTD",
  "ibm-not-wf-P69-ibm69n02.xml": "DTD",
  "ibm-not-wf-P69-ibm69n03.xml": "DTD",
  "ibm-not-wf-P69-ibm69n04.xml": "DTD",
  "ibm-not-wf-P69-ibm69n05.xml": "DTD",
  "ibm-not-wf-P69-ibm69n06.xml": "DTD",
  "ibm-not-wf-P69-ibm69n07.xml": "DTD",
  "ibm-not-wf-P85-ibm85n01.xml": "DTD",
  "ibm-not-wf-P85-ibm85n02.xml": "DTD",
  "ibm-not-wf-P88-ibm88n01.xml": "DTD",
  "ibm-not-wf-P88-ibm88n02.xml": "DTD",
  "ibm-not-wf-P89-ibm89n01.xml": "DTD",
  "ibm-not-wf-P89-ibm89n02.xml": "DTD",
  "ibm-valid-P09-ibm09v01.xml": "ENTITIES",
  "ibm-valid-P09-ibm09v02.xml": "ENTITIES",
  "ibm-valid-P09-ibm09v04.xml": "ENTITIES",
  "ibm-valid-P10-ibm10v01.xml": "ENTITIES",
  "ibm-valid-P10-ibm10v02.xml": "ENTITIES",
  "ibm-valid-P10-ibm10v03.xml": "ENTITIES",
  "ibm-valid-P10-ibm10v04.xml": "ENTITIES",
  "ibm-valid-P10-ibm10v05.xml": "ENTITIES",
  "ibm-valid-P10-ibm10v06.xml": "ENTITIES",
  "ibm-valid-P10-ibm10v07.xml": "ENTITIES",
  "ibm-valid-P10-ibm10v08.xml": "ENTITIES",
  "ibm-valid-P29-ibm29v01.xml": "ENTITIES",
  "ibm-valid-P43-ibm43v01.xml": "ENTITIES",
  "ibm-valid-P67-ibm67v01.xml": "ENTITIES",
  "rmt-e2e-15e": "ENTITIES",
  "rmt-e2e-15f": "ENTITIES",
  "rmt-ns10-043": "DTD",
  "rmt-ns10-044": "DTD",
  "rmt-e3e-06i": "DTD",
  "rmt-e3e-12": "DTD",
};

class SaxesSelection extends Selection {
  shouldSkipTest(test) {
    return Promise.resolve()
      .then(() => SKIP[test.id] ||
            //
            // Section 4.2 deals with ENTITY declarations which
            // appear in DTDs.
            //
            // Section 4.2.2 deals with NDATA which appears in DTDs.
            //
            // Section 4.7 deals with NOTATION declarations. These
            // appear in DTDs and we don't parse them.
            //
            test.includesSections(["4.2", "4.2.2", "4.7"]) ||
            super.shouldSkipTest(test));
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
