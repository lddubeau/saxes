"use strict";

const { XML_1_0: { ED5 } } = require("xmlchars");

const {
  regexes: {
    CHAR,
    NAME_START_CHAR,
    NAME_CHAR,
  },
} = ED5;

const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
const XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";

// We have to make our own regexp because the way we record character references
// as entities. So we have to allow for "#" at the start.
const ENTITY_START_CHAR =
      new RegExp(`^[${ED5.fragments.NAME_START_CHAR}#]$`, "u");

const rootNS = {
  __proto__: null,
  xml: XML_NAMESPACE,
  xmlns: XMLNS_NAMESPACE,
};

const XML_ENTITIES = {
  __proto__: null,
  amp: "&",
  gt: ">",
  lt: "<",
  quot: "\"",
  apos: "'",
};

const S_BEGIN_WHITESPACE = 0; // leading whitespace
const S_TEXT = 1; // general stuff
const S_ENTITY = 2; // &amp and such.
const S_OPEN_WAKA = 3; // <
const S_OPEN_WAKA_BANG = 4; // <!...
const S_DOCTYPE = 5; // <!DOCTYPE
const S_DOCTYPE_QUOTED = 6; // <!DOCTYPE "//blah
const S_DOCTYPE_DTD = 7; // <!DOCTYPE "//blah" [ ...
const S_DOCTYPE_DTD_QUOTED = 8; // <!DOCTYPE "//blah" [ "foo
const S_COMMENT = 9; // <!--
const S_COMMENT_ENDING = 10; // <!-- blah -
const S_COMMENT_ENDED = 11; // <!-- blah --
const S_CDATA = 12; // <![CDATA[ something
const S_CDATA_ENDING = 13; // ]
const S_CDATA_ENDING_2 = 14; // ]]
const S_PI = 15; // <?hi
const S_PI_BODY = 16; // <?hi there
const S_PI_ENDING = 17; // <?hi "there" ?
const S_OPEN_TAG = 18; // <strong
const S_OPEN_TAG_SLASH = 19; // <strong /
const S_ATTRIB = 20; // <a
const S_ATTRIB_NAME = 21; // <a foo
const S_ATTRIB_NAME_SAW_WHITE = 22; // <a foo _
const S_ATTRIB_VALUE = 23; // <a foo=
const S_ATTRIB_VALUE_QUOTED = 24; // <a foo="bar
const S_ATTRIB_VALUE_CLOSED = 25; // <a foo="bar"
const S_ATTRIB_VALUE_UNQUOTED = 26; // <a foo=bar
const S_CLOSE_TAG = 27; // </a
const S_CLOSE_TAG_SAW_WHITE = 28; // </a   >
const S_XML_DECL_NAME_START = 29; // <?xml
const S_XML_DECL_NAME = 30; // <?xml foo
const S_XML_DECL_EQ = 31; // <?xml foo=
const S_XML_DECL_VALUE_START = 32; // <?xml foo=
const S_XML_DECL_VALUE = 33; // <?xml foo="bar"

const STATE_TO_METHOD_NAME = new Array(S_CLOSE_TAG_SAW_WHITE + 1);
STATE_TO_METHOD_NAME[S_BEGIN_WHITESPACE] = "sBeginWhitespace";
STATE_TO_METHOD_NAME[S_TEXT] = "sText";
STATE_TO_METHOD_NAME[S_ENTITY] = "sEntity";
STATE_TO_METHOD_NAME[S_OPEN_WAKA] = "sOpenWaka";
STATE_TO_METHOD_NAME[S_OPEN_WAKA_BANG] = "sOpenWakaBang";
STATE_TO_METHOD_NAME[S_DOCTYPE] = "sDoctype";
STATE_TO_METHOD_NAME[S_DOCTYPE_QUOTED] = "sDoctypeQuoted";
STATE_TO_METHOD_NAME[S_DOCTYPE_DTD] = "sDoctypeDTD";
STATE_TO_METHOD_NAME[S_DOCTYPE_DTD_QUOTED] = "sDoctypeDTDQuoted";
STATE_TO_METHOD_NAME[S_COMMENT] = "sComment";
STATE_TO_METHOD_NAME[S_COMMENT_ENDING] = "sCommentEnding";
STATE_TO_METHOD_NAME[S_COMMENT_ENDED] = "sCommentEnded";
STATE_TO_METHOD_NAME[S_CDATA] = "sCData";
STATE_TO_METHOD_NAME[S_CDATA_ENDING] = "sCDataEnding";
STATE_TO_METHOD_NAME[S_CDATA_ENDING_2] = "sCDataEnding2";
STATE_TO_METHOD_NAME[S_PI] = "sPI";
STATE_TO_METHOD_NAME[S_PI_BODY] = "sPIBody";
STATE_TO_METHOD_NAME[S_PI_ENDING] = "sPIEnding";
STATE_TO_METHOD_NAME[S_OPEN_TAG] = "sOpenTag";
STATE_TO_METHOD_NAME[S_OPEN_TAG_SLASH] = "sOpenTagSlash";
STATE_TO_METHOD_NAME[S_ATTRIB] = "sAttrib";
STATE_TO_METHOD_NAME[S_ATTRIB_NAME] = "sAttribName";
STATE_TO_METHOD_NAME[S_ATTRIB_NAME_SAW_WHITE] = "sAttribNameSawWhite";
STATE_TO_METHOD_NAME[S_ATTRIB_VALUE] = "sAttribValue";
STATE_TO_METHOD_NAME[S_ATTRIB_VALUE_QUOTED] = "sAttribValueQuoted";
STATE_TO_METHOD_NAME[S_ATTRIB_VALUE_CLOSED] = "sAttribValueClosed";
STATE_TO_METHOD_NAME[S_ATTRIB_VALUE_UNQUOTED] = "sAttribValueUnquoted";
STATE_TO_METHOD_NAME[S_CLOSE_TAG] = "sCloseTag";
STATE_TO_METHOD_NAME[S_CLOSE_TAG_SAW_WHITE] = "sCloseTagSawWhite";

const SPACE_SEPARATOR = "SPACE_SEPARATOR";

exports.EVENTS = [
  "text",
  "processinginstruction",
  "doctype",
  "comment",
  "opentagstart",
  "attribute",
  "opentag",
  "closetag",
  "opencdata",
  "cdata",
  "closecdata",
  "error",
  "end",
  "ready",
  "opennamespace",
  "closenamespace",
];

const buffers = [
  "comment", "openWakaBang", "textNode", "textFragments", "tagName", "doctype",
  "piTarget", "piBody", "entity", "attribName", "attribValue", "cdata",
  "xmlDeclName", "xmlDeclValue",
];

function isWhitespace(c) {
  return c === " " || c === "\n" || c === "\r" || c === "\t";
}

function isQuote(c) {
  return c === "\"" || c === "'";
}

class SAXParser {
  /**
   * @param {Object} opt The parser options.
   */
  constructor(opt) {
    this._init(opt);
  }

  /**
   * Reset the parser state.
   *
   * @private
   */
  _init(opt) {
    for (const buffer of buffers) {
      this[buffer] = "";
    }

    this.q = "";
    this.opt = opt || {};
    this.tags = [];
    this.initial = true;
    this.closed = this.closedRoot = this.sawRoot = this.inRoot = false;
    this.tag = null;
    this.state = S_BEGIN_WHITESPACE;
    this.ENTITIES = Object.create(XML_ENTITIES);
    this.attribList = [];
    this.reportedTextBeforeRoot = false;
    this.reportedTextAfterRoot = false;
    this.xmlDeclPossible = true;
    this.piIsXMLDecl = false;
    this.xmlDeclState = S_XML_DECL_NAME_START;
    this.xmlDeclExpects = ["version"];
    this.requiredSeparator = undefined;
    this.xmlDecl = {
      version: undefined,
      encoding: undefined,
      standalone: undefined,
    };
    this.entityBufferName = undefined;
    this.entityReturnState = undefined;

    // namespaces form a prototype chain.
    // it always points at the current tag,
    // which protos to its parent tag.
    if (this.opt.xmlns) {
      this.ns = Object.create(rootNS);
    }

    this.trackPosition = this.opt.position !== false;
    if (this.trackPosition) {
      this.line = 1;
      this.position = this.column = 0;
      this.fileName = this.opt.fileName;
    }
    this.onready();
  }

  // We provide default no-op handlers.
  /* eslint-disable class-methods-use-this */
  ontext() {}
  onprocessinginstruction() {}
  ondoctype() {}
  oncomment() {}
  onopentagstart() {}
  onattribute() {}
  onopentag() {}
  onclosetag() {}
  onopencdata() {}
  oncdata() {}
  onclosecdata() {}
  onend() {}
  onready() {}
  onopennamespace() {}
  onclosenamespace() {}
  onerror(err) {
    throw new Error(err);
  }
  /* eslint-enable class-methods-use-this */

  /**
   * Report a parsing error. This method is made public so that client code may
   * check for issues that are outside the scope of this project and can report
   * errors.
   *
   * @param {Error} er The error to report.
   *
   * @returns this
   */
  fail(er) {
    this.closeText();
    const message = (this.trackPosition) ?
          `${this.fileName}:${this.line}:${this.column}: ${er}` : er;

    this.onerror(new Error(message));
    return this;
  }

  /**
   * Write a XML data to the parser.
   *
   * @param {string} chunk The XML data to write.
   *
   * @returns this
   */
  write(chunk) {
    if (this.closed) {
      return this.fail("cannot write after close; assign an onready handler.");
    }
    if (chunk === null) {
      return this.end();
    }
    if (typeof chunk === "object") {
      chunk = chunk.toString();
    }

    const limit = chunk.length;
    const chunkState = {
      chunk,
      limit,
      i: 0,
      c: undefined,
    };
    while (chunkState.i < limit) {
      const handler = this[STATE_TO_METHOD_NAME[this.state]];
      if (!handler) {
        throw new Error(this, `Unknown state: ${this.state}`);
      }
      handler.call(this, chunkState);
    }

    return this;
  }

  /**
   * Close the current stream. Perform final well-formedness checks and reset
   * the parser tstate.
   *
   * @returns this
   */
  close() {
    return this.write(null);
  }

  /**
   * If the text buffer or the cdata buffer contain something emit the
   * respective ``ontext`` and ``cdata`` events, and empty the buffers.
   *
   * @returns this
   */
  flush() {
    this.closeText();
    if (this.cdata !== "") {
      this.this.emitNode("oncdata", this.cdata);
      this.cdata = "";
    }

    return this;
  }

  /**
   * Get a single character out of the current chunk. This updates the current
   * position if we do position tracking.
   *
   * @private
   *
   * @param chunkState The chunk state.
   *
   * @returns The character read.
   */
  getChar(chunkState) {
    const { chunk, i } = chunkState;
    let c = chunk[i];
    let skip;
    if (c >= "\uD800" && c <= "\uDFFF") {
      c = String.fromCodePoint(chunk.codePointAt(i));
      skip = c.length;
      chunkState.i += skip;
    }
    else {
      chunkState.i++;
      skip = 1;
    }

    if (!CHAR.test(c)) {
      this.fail("disallowed character.");
    }

    if (c && this.trackPosition) {
      this.position += skip;
      if (c === "\n") {
        this.line++;
        this.column = 0;
      }
      else {
        this.column += skip;
      }
    }

    return c;
  }

  /**
   * Capture characters into a buffer while a condition is true.
   *
   * @private
   *
   * @param chunkState The current chunk state.
   *
   * @param test A test to perform on each character. The capture ends when the
   * test fails.
   *
   * @param buffer The name of the buffer to save into.
   *
   * @param [checkFragment] A test to perform on the captured fragment.
   *
   * @return The character that made the test fail, or ``undefined`` if we hit
   * the end of the chunk.
   */
  captureWhile(chunkState, test, buffer, checkFragment) {
    const { limit, chunk, i: start } = chunkState;
    let skip;
    let c;
    let atStart = this[buffer].length === 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (chunkState.i >= limit) {
        c = undefined;
        skip = 0;
        break;
      }

      c = this.getChar(chunkState);
      const wasAtStart = atStart;
      atStart = false;
      if (!test(c, wasAtStart)) {
        skip = c.length;
        break;
      }
    }

    const fragment = chunk.substring(start, chunkState.i - skip);

    if (checkFragment) {
      checkFragment(fragment);
    }

    this[buffer] += fragment;
    return c;
  }

  /**
   * Skip characters while a condition is true.
   *
   * @private
   *
   * @param chunkState Chunk information
   *
   * @param test A test to perform on each character. The skip ends when the
   * test fails.
   *
   * @return The character that made the test fail, or ``undefined`` if we hit
   * the end of the chunk.
   */
  skipWhile(chunkState, test) {
    const { limit } = chunkState;
    let c;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (chunkState.i >= limit) {
        c = undefined;
        break;
      }

      c = this.getChar(chunkState);
      if (!test(c)) {
        break;
      }
    }

    return c;
  }

  /**
   * Skip dwhitespace characters.
   *
   * @private
   *
   * @param chunkState The current chunk state.
   *
   * @return The character that made the test fail, or ``undefined`` if we hit
   * the end of the chunk.
   */
  skipWhitespace(chunkState) {
    const { limit } = chunkState;
    let c;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (chunkState.i >= limit) {
        c = undefined;
        break;
      }

      c = this.getChar(chunkState);
      if (!isWhitespace(c)) {
        break;
      }
    }

    return c;
  }


  // STATE HANDLERS

  /** @private */
  sBeginWhitespace(chunkState) {
    const { limit } = chunkState;
    let c = this.getChar(chunkState);
    if (this.initial && c === "\uFEFF") {
      this.initial = false;
      if (chunkState.i >= limit) {
        return;
      }
      c = this.getChar(chunkState);
    }
    else {
      this.initial = false;
    }
    // We cannot use skipWhile here because we have to use the previously
    // read character first.
    while (chunkState.i < limit && isWhitespace(c)) {
      c = this.getChar(chunkState);
      this.xmlDeclPossible = false;
    }
    if (c === "<") {
      this.state = S_OPEN_WAKA;
      this.startTagPosition = this.position;
    }
    else {
      // have to process this as a text node.
      // weird, but happens.
      if (!this.reportedTextBeforeRoot) {
        this.fail("text data outside of root node.");
        this.reportedTextBeforeRoot = true;
      }
      this.textNode = c;
      this.state = S_TEXT;
      this.xmlDeclPossible = false;
    }
  }

  /** @private */
  sText(chunkState) {
    const c = this.captureWhile(
      chunkState,
      cx => cx !== "<" && cx !== "&",
      "textNode",
      (fragment) => {
        // Text fragments is a buffer we use to check for the precence of a
        // literal "]]>" in text nodes. We cannot do the check against textNode
        // itself because textNode will contain resolve entities so "]]&gt;"
        // would turn to "]]>" in textNode and raise a false error.
        this.textFragments += fragment;
        // We also have to check the end of textFragments because some cases may
        // slip through otherwise. For instance, if client code write
        // char-by-char. Then fragment will never contain ]]> but instead we'll
        // have 3 fragments one with "]", a second with "]" and a third with
        // ">".
        if (fragment.includes("]]>") || this.textFragments.endsWith("]]>")) {
          this.fail("the string \"]]>\" is disallowed in char data.");
        }

        if (!this.inRoot && /\S/.test(fragment)) {
          // We use the reportedTextBeforeRoot and reportedTextAfterRoot flags
          // to avoid reporting errors for every single character that is out of
          // place.
          if (!this.sawRoot && !this.reportedTextBeforeRoot) {
            this.fail("text data outside of root node.");
            this.reportedTextBeforeRoot = true;
          }

          if (this.closedRoot && !this.reportedTextAfterRoot) {
            this.fail("text data outside of root node.");
            this.reportedTextAfterRoot = true;
          }
        }
      });

    switch (c) {
    case "<":
      this.state = S_OPEN_WAKA;
      this.startTagPosition = this.position;
      this.textFragments = "";
      break;
    case "&":
      // We use the reportedTextBeforeRoot and reportedTextAfterRoot flags to
      // avoid reporting errors for every single character that is out of place.
      if (!this.sawRoot && !this.reportedTextBeforeRoot) {
        this.fail("text data outside of root node.");
        this.reportedTextBeforeRoot = true;
      }

      if (this.closedRoot && !this.reportedTextAfterRoot) {
        this.fail("text data outside of root node.");
        this.reportedTextAfterRoot = true;
      }

      this.state = S_ENTITY;
      this.entityBufferName = "textNode";
      this.entityReturnState = S_TEXT;
      // If we run into an entity, then necessarily we do not have a "]]>"
      // literal. So we flush this.textFragments.
      this.textFragments = "";
      break;
    default:
    }
  }

  /** @private */
  sOpenWaka(chunkState) {
    const c = this.getChar(chunkState);
    // either a /, ?, !, or text is coming next.
    if (NAME_START_CHAR.test(c)) {
      this.state = S_OPEN_TAG;
      this.tagName = c;
      this.xmlDeclPossible = false;
    }
    else {
      switch (c) {
      case "/":
        this.state = S_CLOSE_TAG;
        this.tagName = "";
        this.xmlDeclPossible = false;
        break;
      case "!":
        this.state = S_OPEN_WAKA_BANG;
        this.openWakaBang = "";
        this.xmlDeclPossible = false;
        break;
      case "?":
        this.state = S_PI;
        this.piTarget = this.piBody = "";
        break;
      default: {
        this.fail("unencoded <.");
        // if there was some whitespace, then add that in.
        const pad = (this.startTagPosition + 1 < this.position) ?
              new Array(this.position - this.startTagPosition).join(" ") :
              "";
        this.textNode += `<${pad}${c}`;
        this.state = S_TEXT;
        this.xmlDeclPossible = false;
      }
      }
    }
  }

  /** @private */
  sOpenWakaBang(chunkState) {
    const c = this.getChar(chunkState);
    switch (this.openWakaBang + c) {
    case "[CDATA[":
      if (!this.sawRoot && !this.reportedTextBeforeRoot) {
        this.fail("text data outside of root node.");
        this.reportedTextBeforeRoot = true;
      }

      if (this.closedRoot && !this.reportedTextAfterRoot) {
        this.fail("text data outside of root node.");
        this.reportedTextAfterRoot = true;
      }
      this.emitNode("onopencdata");
      this.state = S_CDATA;
      this.openWakaBang = "";
      this.cdata = "";
      break;
    case "--":
      this.state = S_COMMENT;
      this.comment = "";
      this.openWakaBang = "";
      break;
    case "DOCTYPE":
      this.state = S_DOCTYPE;
      if (this.doctype || this.sawRoot) {
        this.fail("inappropriately located doctype declaration.");
      }
      this.doctype = "";
      this.openWakaBang = "";
      break;
    default:
      this.openWakaBang += c;
      // 7 happens to be the maximum length of the string that can possibly
      // match one of the cases above.
      if (this.openWakaBang.length >= 7) {
        this.fail("incorrect syntax.");
      }
    }
  }

  /** @private */
  sDoctype(chunkState) {
    const c = this.captureWhile(chunkState,
                                cx => cx !== "[" && !isQuote(cx) && cx !== ">",
                                "doctype");
    if (c === ">") {
      this.state = S_TEXT;
      this.emitNode("ondoctype", this.doctype);
      this.doctype = true; // just remember that we saw it.
    }
    else if (c) {
      this.doctype += c;
      if (c === "[") {
        this.state = S_DOCTYPE_DTD;
      }
      else if (isQuote(c)) {
        this.state = S_DOCTYPE_QUOTED;
        this.q = c;
      }
    }
  }

  /** @private */
  sDoctypeQuoted(chunkState) {
    const c = this.captureWhile(chunkState, cx => cx !== this.q, "doctype");
    if (c !== this.q) {
      return;
    }

    this.doctype += c;
    this.q = "";
    this.state = S_DOCTYPE;
  }

  /** @private */
  sDoctypeDTD(chunkState) {
    const c = this.captureWhile(chunkState, cx => cx !== "]" && !isQuote(cx),
                                "doctype");
    if (!c) {
      return;
    }

    this.doctype += c;
    if (c === "]") {
      this.state = S_DOCTYPE;
    }
    else if (isQuote(c)) {
      this.state = S_DOCTYPE_DTD_QUOTED;
      this.q = c;
    }
  }

  /** @private */
  sDoctypeDTDQuoted(chunkState) {
    const c = this.captureWhile(chunkState, cx => cx !== this.q, "doctype");
    if (!c) {
      return;
    }

    this.doctype += c;
    if (c === this.q) {
      this.state = S_DOCTYPE_DTD;
      this.q = "";
    }
  }

  /** @private */
  sComment(chunkState) {
    const c = this.captureWhile(chunkState, cx => cx !== "-", "comment");
    if (c === "-") {
      this.state = S_COMMENT_ENDING;
    }
    else if (c) {
      this.comment += c;
    }
  }

  /** @private */
  sCommentEnding(chunkState) {
    const c = this.getChar(chunkState);
    if (c === "-") {
      this.state = S_COMMENT_ENDED;
      if (this.comment) {
        this.emitNode("oncomment", this.comment);
      }
      this.comment = "";
    }
    else {
      this.comment += `-${c}`;
      this.state = S_COMMENT;
    }
  }

  /** @private */
  sCommentEnded(chunkState) {
    const c = this.getChar(chunkState);
    if (c !== ">") {
      this.fail("malformed comment.");
      // <!-- blah -- bloo --> will be recorded as
      // a comment of " blah -- bloo "
      this.comment += `--${c}`;
      this.state = S_COMMENT;
    }
    else {
      this.state = S_TEXT;
    }
  }

  sCData(chunkState) {
    const c = this.captureWhile(chunkState, cx => cx !== "]", "cdata");
    if (!c) {
      return;
    }

    if (c === "]") {
      this.state = S_CDATA_ENDING;
    }
    else {
      this.cdata += c;
    }
  }

  /** @private */
  sCDataEnding(chunkState) {
    const c = this.getChar(chunkState);
    if (c === "]") {
      this.state = S_CDATA_ENDING_2;
    }
    else {
      this.cdata += `]${c}`;
      this.state = S_CDATA;
    }
  }

  /** @private */
  sCDataEnding2(chunkState) {
    const c = this.getChar(chunkState);
    if (c === ">") {
      if (this.cdata) {
        this.emitNode("oncdata", this.cdata);
      }
      this.emitNode("onclosecdata");
      this.cdata = "";
      this.state = S_TEXT;
    }
    else if (c === "]") {
      this.cdata += "]";
    }
    else {
      this.cdata += `]]${c}`;
      this.state = S_CDATA;
    }
  }

  /** @private */
  sPI(chunkState) {
    const c = this.captureWhile(
      chunkState,
      (cx, first) => {
        if (cx !== "?" && !isWhitespace(cx)) {
          if (!((first ? NAME_START_CHAR : NAME_CHAR).test(cx) &&
                // When namespaces are used, colons are not allowed in entity
                // names.
                // https://www.w3.org/XML/xml-names-19990114-errata.html
                // NE08
                (!this.opt.xmlns || cx !== ":"))) {
            this.fail("disallowed characer in processing instruction name.");
          }

          return true;
        }

        return false;
      },
      "piTarget");

    if (!(c === "?" || isWhitespace(c))) {
      return;
    }

    this.piIsXMLDecl = this.piTarget === "xml";
    if (this.piIsXMLDecl && !this.xmlDeclPossible) {
      this.fail("an XML declaration must be at the start of the document.");
    }
    this.state = c === "?" ? S_PI_ENDING : S_PI_BODY;
  }

  /** @private */
  sPIBody(chunkState) {
    let c;
    if (this.piIsXMLDecl) {
      switch (this.xmlDeclState) {
      case S_XML_DECL_NAME_START:
        c = this.skipWhile(chunkState, (cx) => {
          if (isWhitespace(cx)) {
            this.requiredSeparator = undefined;

            return true;
          }

          if (cx !== "?" && this.requiredSeparator === SPACE_SEPARATOR) {
            this.fail("whitespace required.");
          }

          this.requiredSeparator = undefined;

          return false;
        });

        // The question mark character is not valid inside any of the XML
        // declaration name/value pairs.
        if (c === "?") {
          this.state = S_PI_ENDING;
          return;
        }

        if (c) {
          this.xmlDeclState = S_XML_DECL_NAME;
          this.xmlDeclName = c;
        }
        break;
      case S_XML_DECL_NAME:
        c = this.captureWhile(chunkState,
                              cx => cx !== "?" && !isWhitespace(cx)
                              && cx !== "=",
                              "xmlDeclName");
        // The question mark character is not valid inside any of the XML
        // declaration name/value pairs.
        if (c === "?") {
          this.state = S_PI_ENDING;
          return;
        }
        if (isWhitespace(c) || c === "=") {
          if (!this.xmlDeclExpects.includes(this.xmlDeclName)) {
            switch (this.xmlDeclName.length) {
            case 0:
              this.fail("did not expect any more name/value pairs.");
              break;
            case 1:
              this.fail(`expected the name ${this.xmlDeclExpects[0]}.`);
              break;
            default:
              this.fail(`expected one of ${this.xmlDeclExpects.join(", ")}`);
            }
          }

          this.xmlDeclState = (c === "=") ? S_XML_DECL_VALUE_START :
            S_XML_DECL_EQ;
        }
        break;
      case S_XML_DECL_EQ:
        c = this.skipWhitespace(chunkState);
        // The question mark character is not valid inside any of the XML
        // declaration name/value pairs.
        if (c === "?") {
          this.state = S_PI_ENDING;
          return;
        }

        if (c) {
          if (c !== "=") {
            this.fail("value required.");
          }
          this.xmlDeclState = S_XML_DECL_VALUE_START;
        }
        break;
      case S_XML_DECL_VALUE_START:
        c = this.skipWhitespace(chunkState);
        // The question mark character is not valid inside any of the XML
        // declaration name/value pairs.
        if (c === "?") {
          this.state = S_PI_ENDING;
          return;
        }

        if (c) {
          if (!isQuote(c)) {
            this.fail("value must be quoted.");
            this.q = " ";
          }
          else {
            this.q = c;
          }
          this.xmlDeclState = S_XML_DECL_VALUE;
          this.xmlDeclValue = "";
        }
        break;
      case S_XML_DECL_VALUE:
        c = this.captureWhile(chunkState, cx => cx !== "?" && cx !== this.q,
                              "xmlDeclValue");

        // The question mark character is not valid inside any of the XML
        // declaration name/value pairs.
        if (c === "?") {
          this.state = S_PI_ENDING;
          return;
        }

        if (c) {
          switch (this.xmlDeclName) {
          case "version":
            if (!/^1\.[0-9]+$/.test(this.xmlDeclValue)) {
              this.fail("version number must match /^1\\.[0-9]+$/.");
            }
            this.xmlDeclExpects = ["encoding", "standalone"];
            this.xmlDecl.version = this.xmlDeclValue;
            break;
          case "encoding":
            if (!/^[A-Za-z][A-Za-z0-9._-]*$/.test(this.xmlDeclValue)) {
              this.fail("encoding value must match \
/^[A-Za-z0-9][A-Za-z0-9._-]*$/.");
            }
            this.xmlDeclExpects = ["standalone"];
            this.xmlDecl.encoding = this.xmlDeclValue;
            break;
          case "standalone":
            if (this.xmlDeclValue !== "yes" && this.xmlDeclValue !== "no") {
              this.fail("standalone value must match \"yes\" or \"no\".");
            }
            this.xmlDeclExpects = [];
            this.xmlDecl.standalone = this.xmlDeclValue;
            break;
          default:
            // We don't need to raise an error here since we've already
            // raised one when checking what name was expected.
          }
          this.xmlDeclName = this.xmlDeclValue = "";
          this.xmlDeclState = S_XML_DECL_NAME_START;
          this.requiredSeparator = SPACE_SEPARATOR;
        }
        break;
      default:
        throw new Error(this,
                        `Unknown XML declaration state: ${this.xmlDeclState}`);
      }
    }
    else if (this.piBody.length === 0) {
      c = this.skipWhitespace(chunkState);
      if (c === "?") {
        this.state = S_PI_ENDING;
      }
      else if (c) {
        this.piBody = c;
      }
    }
    else {
      c = this.captureWhile(chunkState, cx => cx !== "?", "piBody");
      // The question mark character is not valid inside any of the XML
      // declaration name/value pairs.
      if (c === "?") {
        this.state = S_PI_ENDING;
      }
    }
  }

  /** @private */
  sPIEnding(chunkState) {
    const c = this.getChar(chunkState);
    if (this.piIsXMLDecl) {
      if (c === ">") {
        if (this.piTarget !== "xml") {
          this.fail("processing instructions are not allowed before root.");
        }
        else if (this.xmlDeclState !== S_XML_DECL_NAME_START) {
          this.fail("XML declaration is incomplete.");
        }
        else if (this.xmlDeclExpects.includes("version")) {
          this.fail("XML declaration must contain a version.");
        }
        this.xmlDeclName = this.xmlDeclValue = "";
        this.requiredSeparator = undefined;
        this.state = S_TEXT;
      }
      else {
        // We got here because the previous character was a ?, but the
        // question mark character is not valid inside any of the XML
        // declaration name/value pairs.
        this.fail(
          "The character ? is disallowed anywhere in XML declarations.");
      }
    }
    else if (c === ">") {
      if (this.piTarget.trim() === "") {
        this.fail("processing instruction without a target.");
      }
      else if (this.piTarget.trim().toLowerCase() === "xml") {
        this.fail("the XML declaration must appear at the start of the document.");
      }
      this.emitNode("onprocessinginstruction", {
        target: this.piTarget,
        body: this.piBody,
      });
      this.piTarget = this.piBody = "";
      this.state = S_TEXT;
    }
    else if (c === "?") {
      // We ran into ?? as part of a processing instruction. We initially
      // took the first ? as a sign that the PI was ending, but it is
      // not. So we have to add it to the body but we take the new ? as a
      // sign that the PI is ending.
      this.piBody += "?";
    }
    else {
      this.piBody += `?${c}`;
      this.state = S_PI_BODY;
    }
    this.xmlDeclPossible = false;
  }

  /** @private */
  sOpenTag(chunkState) {
    const c = this.captureWhile(
      chunkState,
      (cx, first) => {
        if (cx !== ">" && !isWhitespace(cx) && cx !== "/") {
          if (!((first ? NAME_START_CHAR : NAME_CHAR).test(cx))) {
            this.fail("disallowed characer in tag name.");
          }

          return true;
        }

        return false;
      },
      "tagName");
    if (!c) {
      return;
    }

    const parent = this.tags[this.tags.length - 1] || this;
    const tag = this.tag = {
      name: this.tagName,
      attributes: Object.create(null),
    };

    // will be overridden if tag contails an xmlns="foo" or xmlns:foo="bar"
    if (this.opt.xmlns) {
      tag.ns = parent.ns;
    }
    this.attribList = [];
    this.emitNode("onopentagstart", tag);

    switch (c) {
    case ">":
      this.openTag();
      break;
    case "/":
      this.state = S_OPEN_TAG_SLASH;
      break;
    default:
      if (!isWhitespace(c)) {
        this.fail("disallowed character in tag name.");
      }
      this.state = S_ATTRIB;
    }
  }

  /** @private */
  sOpenTagSlash(chunkState) {
    const c = this.getChar(chunkState);
    if (c === ">") {
      this.openTag(true);
      this.closeTag();
    }
    else {
      this.fail("forward-slash in opening tag not followed by >.");
      this.state = S_ATTRIB;
    }
  }

  /** @private */
  sAttrib(chunkState) {
    const c = this.skipWhitespace(chunkState);
    if (!c) {
      return;
    }

    if (NAME_START_CHAR.test(c)) {
      this.attribName = c;
      this.attribValue = "";
      this.state = S_ATTRIB_NAME;
    }
    else if (c === ">") {
      this.openTag();
    }
    else if (c === "/") {
      this.state = S_OPEN_TAG_SLASH;
    }
    else {
      this.fail("disallowed character in attribute name.");
    }
  }

  /** @private */
  sAttribName(chunkState) {
    const c = this.captureWhile(
      chunkState,
      (cx, first) => {
        if (cx !== "=" && !isWhitespace(cx) && cx !== ">") {
          if (!((first ? NAME_START_CHAR : NAME_CHAR).test(cx))) {
            this.fail("disallowed characer in attribute name.");
          }

          return true;
        }

        return false;
      },
      "attribName");
    if (c === "=") {
      this.state = S_ATTRIB_VALUE;
    }
    else if (isWhitespace(c)) {
      this.state = S_ATTRIB_NAME_SAW_WHITE;
    }
    else if (c === ">") {
      this.fail("attribute without value.");
      this.attribList.push([this.attribName, this.attribName]);
      this.attribName = this.attribValue = "";
      this.openTag();
    }
    else if (c) {
      this.fail("disallowed character in attribute name.");
    }
  }

  /** @private */
  sAttribNameSawWhite(chunkState) {
    const c = this.skipWhitespace(chunkState);
    if (c === "=") {
      this.state = S_ATTRIB_VALUE;
    }
    else if (c) {
      this.fail("attribute without value.");
      this.tag.attributes[this.attribName] = "";
      this.attribValue = "";
      this.emitNode("onattribute", {
        name: this.attribName,
        value: "",
      });
      this.attribName = "";
      if (c === ">") {
        this.openTag();
      }
      else if (NAME_START_CHAR.test(c)) {
        this.attribName = c;
        this.state = S_ATTRIB_NAME;
      }
      else {
        this.fail("disallowed character in attribute name.");
        this.state = S_ATTRIB;
      }
    }
  }

  /** @private */
  sAttribValue(chunkState) {
    const c = this.skipWhitespace(chunkState);
    if (isQuote(c)) {
      this.q = c;
      this.state = S_ATTRIB_VALUE_QUOTED;
    }
    else if (c) {
      this.fail("unquoted attribute value.");
      this.state = S_ATTRIB_VALUE_UNQUOTED;
      this.attribValue = c;
    }
  }

  /** @private */
  sAttribValueQuoted(chunkState) {
    const c = this.captureWhile(
      chunkState,
      (cx) => {
        if (cx === "<") {
          this.fail("disallowed character.");
        }
        return cx !== this.q && cx !== "&";
      },
      "attribValue");
    if (c === "&") {
      this.state = S_ENTITY;
      this.entityBufferName = "attribValue";
      this.entityReturnState = S_ATTRIB_VALUE_QUOTED;
    }
    else if (c) {
      if (this.attribValue.includes("]]>")) {
        this.fail("the string \"]]>\" is disallowed in char data.");
      }
      this.attribList.push([this.attribName, this.attribValue]);
      this.attribName = this.attribValue = "";
      this.q = "";
      this.state = S_ATTRIB_VALUE_CLOSED;
    }
  }

  /** @private */
  sAttribValueClosed(chunkState) {
    const c = this.getChar(chunkState);
    if (isWhitespace(c)) {
      this.state = S_ATTRIB;
    }
    else if (NAME_START_CHAR.test(c)) {
      this.fail("no whitespace between attributes.");
      this.attribName = c;
      this.attribValue = "";
      this.state = S_ATTRIB_NAME;
    }
    else if (c === ">") {
      this.openTag();
    }
    else if (c === "/") {
      this.state = S_OPEN_TAG_SLASH;
    }
    else {
      this.fail("disallowed character in attribute name.");
    }
  }

  /** @private */
  sAttribValueUnquoted(chunkState) {
    const c = this.captureWhile(
      chunkState,
      (cx) => {
        if (cx === "<") {
          this.fail("disallowed character.");
        }
        return cx !== ">" && cx !== "&" && !isWhitespace(cx);
      },
      "attribValue");
    if (c === "&") {
      this.state = S_ENTITY;
      this.entityBufferName = "attribValue";
      this.entityReturnState = S_ATTRIB_VALUE_UNQUOTED;
    }
    else if (c) {
      if (this.attribValue.includes("]]>")) {
        this.fail("the string \"]]>\" is disallowed in char data.");
      }
      this.attribList.push([this.attribName, this.attribValue]);
      this.attribName = this.attribValue = "";
      if (c === ">") {
        this.openTag();
      }
      else {
        this.state = S_ATTRIB;
      }
    }
  }

  /** @private */
  sCloseTag(chunkState) {
    const c = this.captureWhile(
      chunkState,
      (cx, first) => {
        if (cx !== ">" && !isWhitespace(cx)) {
          if (!((first ? NAME_START_CHAR : NAME_CHAR).test(cx))) {
            this.fail("disallowed characer in tag name.");
          }

          return true;
        }

        return false;
      },
      "tagName");
    if (c === ">") {
      this.closeTag();
    }
    else if (isWhitespace(c)) {
      this.state = S_CLOSE_TAG_SAW_WHITE;
    }
  }

  /** @private */
  sCloseTagSawWhite(chunkState) {
    const c = this.skipWhitespace(chunkState);
    if (c === ">") {
      this.closeTag();
    }
    else if (c) {
      this.fail("disallowed character in closing tag.");
    }
  }

  /** @private */
  sEntity(chunkState) {
    const c = this.getChar(chunkState);
    if ((this.entity.length ? NAME_CHAR : ENTITY_START_CHAR).test(c) &&
        // When namespaces are used, colons are not valid in entity
        // names.
        // https://www.w3.org/XML/xml-names-19990114-errata.html
        // NE08
        (!this.opt.xmlns || c !== ":")) {
      this.entity += c;
    }
    else if (c === ";") {
      this[this.entityBufferName] += this.parseEntity();
      this.entity = "";
      this.state = this.entityReturnState;
    }
    else {
      this.fail("disallowed character in entity name.");
      this[this.entityBufferName] += `&${this.entity}${c}`;
      this.entity = "";
      this.state = this.entityReturnState;
    }
  }

  // END OF STATE HANDLERS

  /**
   * End parsing. This performs final well-formedness checks and resets the
   * parser to a clean state.
   *
   * @private
   *
   * @returns this
   */
  end() {
    if (!this.sawRoot) {
      this.fail("document must contain a root element.");
    }
    if (this.sawRoot && !this.closedRoot) {
      this.fail("unclosed root tag.");
    }
    if ((this.state !== S_BEGIN_WHITESPACE) &&
        (this.state !== S_TEXT)) {
      this.fail("unexpected end.");
    }
    this.closeText();
    this.closed = true;
    this.onend();
    this._init(this.opt);
    return this;
  }

  /**
   * If there's text to emit ``ontext``, emit it.
   *
   * @private
   */
  closeText() {
    if (this.textNode) {
      this.ontext(this.textNode);
    }
    this.textNode = "";
  }

  /**
   * Emit any buffered text. Then emit the specified node type.
   *
   * @param {string} nodeType The node type to emit.
   *
   * @param {string} data The data associated with the node type.
   *
   * @private
   */
  emitNode(nodeType, data) {
    if (this.textNode) {
      this.closeText();
    }
    this[nodeType](data);
  }

  /**
   * Parse a qname into its prefix and local name parts.
   *
   * @private
   *
   * @param {string} name The name to parse
   *
   * @param {boolean} [attribute] Whether we are in an attribute.
   *
   * @returns {Object.<prefix: {string}, local: {string}>}
   */
  qname(name, attribute) {
    const colon = name.indexOf(":");
    let prefix;
    let local;

    if (colon < 0) {
      // <x "xmlns"="http://foo">
      if (attribute && name === "xmlns") {
        prefix = "xmlns";
        local = "";
      }
      else {
        prefix = "";
        local = name;
      }
    }
    else {
      // A colon at the start of the name is illegal.
      if (colon === 0) {
        this.fail(`malformed name: ${name}.`);
      }
      prefix = name.substr(0, colon);
      local = name.substr(colon + 1);
    }
    return { prefix, local };
  }

  /**
   * Handle a complete open tag. This parser code calls this once it has seen
   * the whole tag. This method checks for well-formeness and then emits
   * ``onopentag``. It also emits any necessary ``onopennamespace``.
   *
   * @param {boolean} [selfClosing=false] Whether the tag is self-closing.
   *
   * @private
   */
  openTag(selfClosing) {
    const { tag } = this;
    if (this.opt.xmlns) {
      // emit namespace binding events
      const parent = this.tags[this.tags.length - 1] || this;

      let { ns } = tag;
      let disconnectedNS = false;
      // eslint-disable-next-line prefer-const
      for (let [name, uri] of this.attribList) {
        const { prefix, local } = this.qname(name, true);
        if (prefix === "xmlns") {
          uri = uri.trim();
          // namespace binding attribute. push the binding into scope
          if (local === "xml" && uri !== XML_NAMESPACE) {
            this.fail(`xml prefix must be bound to ${XML_NAMESPACE}.`);
          }
          else if (local === "xmlns" && uri !== XMLNS_NAMESPACE) {
            this.fail(`xmlns prefix must be bound to ${XMLNS_NAMESPACE}.`);
          }
          else {
            switch (uri) {
            case XMLNS_NAMESPACE:
              if (local === "") {
                this.fail(`the default namespace may not be set to
${XMLNS_NAMESPACE}.`);
              }
              else {
                this.fail(`may not assign a prefix (even "xmlns") to the URI \
${XMLNS_NAMESPACE}.`);
              }
              break;
            case XML_NAMESPACE:
              if (local === "") {
                this.fail(`the default namespace may not be set to
${XML_NAMESPACE}.`);
              }
              else if (local !== "xml") {
                this.fail(
                  "may not assign the xml namespace to another prefix.");
              }
              break;
            default:
            }

            if (!disconnectedNS) {
              ns = tag.ns = Object.create(parent.ns);
              disconnectedNS = true;
            }
            ns[local] = uri;
            this.emitNode("onopennamespace", { prefix: local, uri });
          }
        }
      }

      // add namespace info to tag
      const qn = this.qname(this.tagName);
      tag.prefix = qn.prefix;
      tag.local = qn.local;
      tag.uri = ns[qn.prefix] || "";

      if (tag.prefix) {
        if (tag.prefix === "xmlns") {
          this.fail("tags may not have \"xmlns\" as prefix.");
        }

        if (!tag.uri) {
          this.fail(`unbound namespace prefix: \
${JSON.stringify(this.tagName)}.`);
          tag.uri = qn.prefix;
        }
      }

      const seen = new Set();
      // Note: do not apply default ns to attributes:
      //   http://www.w3.org/TR/REC-xml-names/#defaulting
      for (const [name, value] of this.attribList) {
        const { prefix, local } = this.qname(name, true);
        const uri = prefix === "" ? "" : (ns[prefix] || "");
        const a = {
          name,
          value,
          prefix,
          local,
          uri,
        };

        const eqname = `{${uri}}${local}`;
        if (seen.has(eqname)) {
          this.fail(`duplicate attribute: ${eqname}.`);
        }
        seen.add(eqname);

        // if there's any attributes with an undefined namespace,
        // then fail on them now.
        if (prefix && prefix !== "xmlns" && !uri) {
          this.fail(`unbound namespace prefix: ${
            JSON.stringify(prefix)}.`);
          a.uri = prefix;
        }
        tag.attributes[name] = a;
        this.emitNode("onattribute", a);
      }
    }
    else {
      for (const [name, value] of this.attribList) {
        const a = { name, value };
        if (this.tag.attributes[name]) {
          this.fail(`duplicate attribute: ${name}.`);
        }
        this.tag.attributes[name] = value;
        this.emitNode("onattribute", a);
      }
    }
    this.attribList = [];

    tag.isSelfClosing = !!selfClosing;

    // process the tag
    if (this.closedRoot) {
      this.fail("documents may contain only one root.");
    }
    this.sawRoot = true;
    if (!this.closedRoot) {
      this.inRoot = true;
    }
    this.tags.push(tag);
    this.emitNode("onopentag", tag);
    if (!selfClosing) {
      this.state = S_TEXT;
      this.tag = null;
      this.tagName = "";
    }
    this.attribName = this.attribValue = "";
  }

  /**
   * Handle a complete close tag. This parser code calls this once it has seen
   * the whole tag. This method checks for well-formeness and then emits
   * ``onclosetag``. It also emits any necessary ``onclosenamespace``.
   *
   * @private
   */
  closeTag() {
    if (!this.tagName) {
      this.fail("weird empty close tag.");
      this.textNode += "</>";
      this.state = S_TEXT;
      return;
    }

    const { tags } = this;
    // first make sure that the closing tag actually exists.
    // <a><b></c></b></a> will close everything, otherwise.
    let t = tags.length;
    const { tagName } = this;
    const closeTo = tagName;
    while (t--) {
      const close = tags[t];
      if (close.name !== closeTo) {
        this.fail("unexpected close tag.");
      }
      else {
        break;
      }
    }

    if (t < 0) {
      this.fail(`unmatched closing tag: ${tagName}.`);
      this.textNode += `</${tagName}>`;
      this.state = S_TEXT;
      return;
    }
    let s = this.tags.length;
    while (s-- > t) {
      const tag = this.tag = tags.pop();
      this.emitNode("onclosetag", tag.name);

      const parent = tags[tags.length - 1] || this;
      if (this.opt.xmlns && tag.ns !== parent.ns) {
        // remove namespace bindings introduced by tag
        for (const p of Object.keys(tag.ns)) {
          this.emitNode("onclosenamespace", { prefix: p, uri: tag.ns[p] });
        }
      }
    }
    if (t === 0) {
      this.inRoot = false;
      this.closedRoot = true;
    }
    this.tagName = this.attribValue = this.attribName = "";
    this.attribList = [];
    this.state = S_TEXT;
  }

  /**
   * Resolves an entity stored in the ``entity`` buffer. Makes any necessary
   * well-formedness checks.
   *
   * @private
   *
   * @returns {string} The parsed entity.
   */
  parseEntity() {
    const { entity } = this;

    const defined = this.ENTITIES[entity];
    if (defined) {
      return defined;
    }

    let num = NaN;
    if (entity[0] === "#") {
      if ((entity[1] === "x") &&
          /^#[x|X][0-9a-fA-F]+$/.test(entity)) {
        num = parseInt(entity.slice(2), 16);
      }
      else if (/^#[0-9]+$/.test(entity)) {
        num = parseInt(entity.slice(1), 10);
      }
    }

    if (Number.isNaN(num) || num > 0x10FFFF) {
      this.fail("malformed character entity.");
      return `&${this.entity};`;
    }

    const char = String.fromCodePoint(num);
    // The character reference is required to match the CHAR production.
    if (!CHAR.test(char)) {
      this.fail("malformed character entity.");
      return `&${this.entity};`;
    }

    return char;
  }
}

exports.parser = function parser(opt) {
  return new SAXParser(opt);
};
exports.SAXParser = SAXParser;
