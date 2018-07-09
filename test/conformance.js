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
  "not-wf-sa-056": "DTD",
  "not-wf-sa-078": "DTD",
  "not-wf-sa-079": "DTD",
  "not-wf-sa-080": "DTD",
  "not-wf-sa-084": "DTD",
  "not-wf-sa-113": "DTD",
  "not-wf-sa-114": "DTD",
  "not-wf-sa-121": "DTD",
  "not-wf-sa-128": "DTD",
  "not-wf-sa-149": "DTD",
  "not-wf-sa-160": "ENTITIES",
  "not-wf-sa-161": "ENTITIES",
  "not-wf-sa-162": "ENTITIES",
  "not-wf-sa-180": "ENTITIES",
  "valid-sa-023": "ENTITIES",
  "valid-sa-024": "ENTITIES",
  "valid-sa-053": "ENTITIES",
  "valid-sa-066": "ENTITIES",
  "valid-sa-085": "ENTITIES",
  "valid-sa-089": "ENTITIES",
  "valid-sa-108": "ENTITIES",
  "valid-sa-110": "ENTITIES",
  "valid-sa-114": "ENTITIES",
  "valid-sa-115": "ENTITIES",
  sa02: "DTD",
  pi: "DTD",
  "o-p43pass1": "ENTITIES",
  "o-p68pass1": "ENTITIES",
  "o-p09fail3": "DTD",
  "o-p12fail1": "DTD",
  "o-p12fail2": "DTD",
  "o-p12fail3": "DTD",
  "o-p12fail4": "DTD",
  "o-p12fail5": "DTD",
  "o-p12fail6": "DTD",
  "o-p12fail7": "DTD",
  "o-p29fail1": "DTD",
  "o-p69fail1": "DTD",
  "o-p69fail2": "DTD",
  "o-p69fail3": "DTD",
  "ibm-not-wf-P28-ibm28n01.xml": "DTD",
  "ibm-not-wf-P28-ibm28n02.xml": "DTD",
  "ibm-not-wf-P28-ibm28n03.xml": "DTD",
  "ibm-not-wf-P28-ibm28n04.xml": "DTD",
  "ibm-not-wf-P28-ibm28n05.xml": "DTD",
  "ibm-not-wf-P28-ibm28n06.xml": "DTD",
  "ibm-not-wf-P29-ibm29n01.xml": "DTD",
  "ibm-not-wf-P29-ibm29n02.xml": "DTD",
  "ibm-not-wf-P29-ibm29n03.xml": "DTD",
  "ibm-not-wf-P29-ibm29n04.xml": "DTD",
  "ibm-not-wf-P29-ibm29n05.xml": "DTD",
  "ibm-not-wf-P29-ibm29n06.xml": "DTD",
  "ibm-not-wf-P29-ibm29n07.xml": "DTD",
  "ibm-not-wf-P66-ibm66n01.xml": "DTD",
  "ibm-not-wf-P66-ibm66n03.xml": "DTD",
  "ibm-not-wf-P66-ibm66n05.xml": "DTD",
  "ibm-not-wf-P66-ibm66n07.xml": "DTD",
  "ibm-not-wf-P66-ibm66n09.xml": "DTD",
  "ibm-not-wf-P66-ibm66n11.xml": "DTD",
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
            // These sections are excluded because they require
            // parsing DTDs.
            test.includesSections(
              ["[12]", "[13]", "[69]", "3.2", "3.2.1", "3.2.2", "3.3",
               "3.3.1", "3.3.2", "4.2", "4.2.2", "4.5", "4.7"]) ||
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

        // for (const x of source) {
        //   parser.write(x);
        // }
        parser.write(source);
        parser.end();
        this.processResult(test, handling, errors.length === 0);
      });
  }
}

build(new ResourceLoader(), SaxesDriver, SaxesSelection).then(run);
