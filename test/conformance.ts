import { BaseDriver } from "@xml-conformance-suite/js/drivers/base";
import { ResourceLoader } from "@xml-conformance-suite/js/resource-loader";
import { TestHandling } from "@xml-conformance-suite/js/selection";
import { BaseSelection } from "@xml-conformance-suite/js/selections/base";
import { loadTests } from "@xml-conformance-suite/js/test-parser";
import { TestSpec } from "@xml-conformance-suite/js/test-spec";
import { Test } from "@xml-conformance-suite/js/test-suite";
import { build } from "@xml-conformance-suite/mocha/builders/basic";

import { SaxesParser } from "../build/dist/saxes";

//
// ENTITIES: this test requires parsing ENTITY declrations in DTDs,
// which we don't support yet.
//
// DTD: this test requires reporting wf errors in a DTD, which we
// don't support yet.
//

const SKIP: Record<string, string> = {
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
  "sa02": "DTD",
  "pi": "DTD",
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
  "ibm-not-wf-P82-ibm82n03.xml": "DTD",
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
  "ibm-1-1-not-wf-P77-ibm77n14.xml": "DTD",
  "ibm-1-1-valid-P02-ibm02v04.xml": "ENTITIES",
  "ibm-1-1-valid-P03-ibm03v05.xml": "ENTITIES",
  "ibm-1-1-valid-P03-ibm03v06.xml": "ENTITIES",
  "ibm-1-1-valid-P03-ibm03v07.xml": "ENTITIES",
  "rmt-e2e-15e": "ENTITIES",
  "rmt-e2e-15f": "ENTITIES",
  "rmt-ns10-043": "DTD",
  "rmt-ns10-044": "DTD",
  "rmt-e3e-06i": "DTD",
  "rmt-e3e-12": "DTD",
};

//
// This table was adapted from the chrome.js selection in xml-conformance-suite
//
// Most likely platform issues (i.e. issues outside the XML parser itself but
// with the JavaScript runtime, either due to the ES standard or the runtime's
// own quirks):
//
// - surrogate encoding:
//
//   V8 goes off the rails when it encounters a surrogate outside a pair. There
//   does not appear to be a workaround.
//
// - unicode garbage-in garbage-out:
//
//   V8 passes garbage upon encountering bad unicode instead of throwing a
//   runtime error. (Python throws.)
//
// - xml declaration encoding:
//
//   By the time the parser sees the document, it cannot know what the original
//   encoding was. It may have been UTF16, which was converted correctly to an
//   internal format.
//
// These are genuine parser errors:
//
// - ignores wf errors in DOCTYPE:
//
//   Even non-validating parsers must report wellformedness errors in DOCTYPE.
//

const PLATFORM_ISSUES: Record<string, string> = {
  "not-wf-sa-168": "surrogate encoding",
  "not-wf-sa-169": "surrogate encoding",
  "not-wf-sa-170": "unicode garbage-in garbage-out",
  "ibm-not-wf-P02-ibm02n30.xml": "surrogate encoding",
  "ibm-not-wf-P02-ibm02n31.xml": "surrogate encoding",
  "rmt-e2e-27": "surrogate encoding",
  "rmt-e2e-50": "xml declaration encoding",
  "rmt-e2e-61": "xml declaration encoding",
  "rmt-011": "xml declarations encoding",
  "rmt-034": "xml declarations encoding",
  "rmt-035": "xml declarations encoding",
  "rmt-041": "xml declarations encoding",
  "rmt-050": "xml declarations encoding",
  "rmt-051": "xml declarations encoding",
  "rmt-054": "xml declarations encoding",
  "x-ibm-1-0.5-not-wf-P04-ibm04n21.xml": "surrogate encoding",
  "x-ibm-1-0.5-not-wf-P04-ibm04n22.xml": "surrogate encoding",
  "x-ibm-1-0.5-not-wf-P04-ibm04n23.xml": "surrogate encoding",
  "x-ibm-1-0.5-not-wf-P04-ibm04n24.xml": "surrogate encoding",
  "x-ibm-1-0.5-not-wf-P04a-ibm04an21.xml": "surrogate encoding",
  "x-ibm-1-0.5-not-wf-P04a-ibm04an22.xml": "surrogate encoding",
  "x-ibm-1-0.5-not-wf-P04a-ibm04an23.xml": "surrogate encoding",
  "x-ibm-1-0.5-not-wf-P04a-ibm04an24.xml": "surrogate encoding",
  "ibm-1-1-not-wf-P02-ibm02n67.xml": "surrogate encoding",
  "ibm-1-1-not-wf-P04-ibm04n21.xml": "surrogate encoding",
  "ibm-1-1-not-wf-P04-ibm04n22.xml": "surrogate encoding",
  "ibm-1-1-not-wf-P04-ibm04n23.xml": "surrogate encoding",
  "ibm-1-1-not-wf-P04-ibm04n24.xml": "surrogate encoding",
  "ibm-1-1-not-wf-P04a-ibm04an21.xml": "surrogate encoding",
  "ibm-1-1-not-wf-P04a-ibm04an22.xml": "surrogate encoding",
  "ibm-1-1-not-wf-P04a-ibm04an23.xml": "surrogate encoding",
  "ibm-1-1-not-wf-P04a-ibm04an24.xml": "surrogate encoding",
  "hst-lhs-007": "xml declaration encoding",
};

class SaxesSelection extends BaseSelection {
  // eslint-disable-next-line class-methods-use-this
  getHandlingByType(test: TestSpec): TestHandling {
    const { testType } = test;
    switch (testType) {
      case "not-wf":
        return "fails";
      case "valid":
        return "succeeds";
      case "invalid":
      case "error":
        return "skip";
      default:
        throw new Error(`unexpected test type: ${testType as string}`);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async shouldSkipTest(test: TestSpec): Promise<boolean> {
    return (SKIP[test.id] !== undefined) ||
      (PLATFORM_ISSUES[test.id] !== undefined) ||
      // These sections are excluded because they require
      // parsing DTDs.
      test.includesSections(["3.2", "3.2.1", "3.2.2", "3.3", "3.3.1",
                             "3.3.2", "4.2", "4.2.2", "4.5", "4.7"]) ||
      test.includesProductions(["[12]", "[13]", "[69]"]) ||
      !((test.includesVersion("1.0") && test.includesEdition("5")) ||
        test.includesEdition("1.1")) ?
      true :
      // The tests that use BOM rely on the parser being able to look at
      // the *raw* data, without decoding. There does not seem to be a way
      // to do this.
      test.getHasBOM();
  }
}

class SaxesDriver extends BaseDriver {
  constructor(private readonly resourceLoader: ResourceLoader) {
    super("saxes");
  }

  // eslint-disable-next-line class-methods-use-this
  writeSource(parser: SaxesParser, source: string): void {
    parser.write(source);
    parser.close();
  }

  async run(test: Test, handling: TestHandling): Promise<void> {
    const { resolvedURI } = test;
    const source = await this.resourceLoader.loadFile(resolvedURI);
    const errors = [];
    const parser = new SaxesParser({
      xmlns: !test.forbidsNamespaces,
    });
    parser.on("error", (err: Error) => {
      if (process?.env?.DEBUG !== undefined) {
        console.log(err);
      }
      errors.push(err);
    });

    this.writeSource(parser, source);
    this.processResult(test, handling, errors.length === 0);
  }
}

class CharByCharDriver extends SaxesDriver {
  // eslint-disable-next-line class-methods-use-this
  writeSource(parser: SaxesParser, source: string): void {
    for (const x of source) {
      parser.write(x);
    }
    parser.close();
  }
}

const resourceLoader = new ResourceLoader();
void loadTests(resourceLoader)
  .then(suite => Promise.all([
    build(suite, "conformance (one write)", resourceLoader,
          SaxesDriver, SaxesSelection),
    build(suite, "conformance (char-by-char)", resourceLoader,
          CharByCharDriver, SaxesSelection),
  ]))
  .then(run)
  .catch(e => console.log(e));
