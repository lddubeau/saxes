"use strict";

const {
  XML_1_0: {
    ED5: {
      isS, isChar, isNameStartChar, isNameChar,
    },
  },
} = require("xmlchars");

const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
const XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";

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

const S_BEGIN_WHITESPACE = "sBeginWhitespace"; // leading whitespace
const S_TEXT = "sText"; // general stuff
const S_ENTITY = "sEntity"; // &amp and such.
const S_OPEN_WAKA = "sOpenWaka"; // <
const S_OPEN_WAKA_BANG = "sOpenWakaBang"; // <!...
const S_DOCTYPE = "sDoctype"; // <!DOCTYPE
const S_DOCTYPE_QUOTED = "sDoctypeQuoted"; // <!DOCTYPE "//blah
const S_DOCTYPE_DTD = "sDoctypeDTD"; // <!DOCTYPE "//blah" [ ...
const S_DOCTYPE_DTD_QUOTED = "sDoctypeDTDQuoted"; // <!DOCTYPE "//blah" [ "foo
const S_COMMENT = "sComment"; // <!--
const S_COMMENT_ENDING = "sCommentEnding"; // <!-- blah -
const S_COMMENT_ENDED = "sCommentEnded"; // <!-- blah --
const S_CDATA = "sCData"; // <![CDATA[ something
const S_CDATA_ENDING = "sCDataEnding"; // ]
const S_CDATA_ENDING_2 = "sCDataEnding2"; // ]]
const S_PI = "sPI"; // <?hi
const S_PI_BODY = "sPIBody"; // <?hi there
const S_PI_ENDING = "sPIEnding"; // <?hi "there" ?
const S_OPEN_TAG = "sOpenTag"; // <strong
const S_OPEN_TAG_SLASH = "sOpenTagSlash"; // <strong /
const S_ATTRIB = "sAttrib"; // <a
const S_ATTRIB_NAME = "sAttribName"; // <a foo
const S_ATTRIB_NAME_SAW_WHITE = "sAttribNameSawWhite"; // <a foo _
const S_ATTRIB_VALUE = "sAttribValue"; // <a foo=
const S_ATTRIB_VALUE_QUOTED = "sAttribValueQuoted"; // <a foo="bar
const S_ATTRIB_VALUE_CLOSED = "sAttribValueClosed"; // <a foo="bar"
const S_ATTRIB_VALUE_UNQUOTED = "sAttribValueUnquoted"; // <a foo=bar
const S_CLOSE_TAG = "sCloseTag"; // </a
const S_CLOSE_TAG_SAW_WHITE = "sCloseTagSawWhite"; // </a   >

// These states are internal to sPIBody
const S_XML_DECL_NAME_START = 1; // <?xml
const S_XML_DECL_NAME = 2; // <?xml foo
const S_XML_DECL_EQ = 3; // <?xml foo=
const S_XML_DECL_VALUE_START = 4; // <?xml foo=
const S_XML_DECL_VALUE = 5; // <?xml foo="bar"

const SPACE_SEPARATOR = "SPACE_SEPARATOR";

/**
 * The list of supported events.
 */
exports.EVENTS = [
  "text",
  "processinginstruction",
  "doctype",
  "comment",
  "opentagstart",
  "opentag",
  "closetag",
  "cdata",
  "error",
  "end",
  "ready",
];

const buffers = [
  "comment", "openWakaBang", "textNode", "tagName", "doctype", "piTarget",
  "piBody", "entity", "attribName", "attribValue", "cdata", "xmlDeclName",
  "xmlDeclValue",
];

const NL = 0xA;
const SPACE = 0x20;
const BANG = 0x21;
const DQUOTE = 0x22;
const HASH = 0x23;
const AMP = 0x26;
const SQUOTE = 0x27;
const MINUS = 0x2D;
const FORWARD_SLASH = 0x2F;
const COLON = 0x3A;
const SEMICOLON = 0x3B;
const LESS = 0x3C;
const EQUAL = 0x3D;
const GREATER = 0x3E;
const QUESTION = 0x3F;
const OPEN_BRACKET = 0x5B;
const CLOSE_BRACKET = 0x5D;

function isQuote(c) {
  return c === DQUOTE || c === SQUOTE;
}

function isEntityStartChar(c) {
  return isNameStartChar(c) || c === HASH;
}

/**
 * Data structure for an XML tag.
 *
 * @typedef {object} SaxesTag
 *
 * @property {string} name The tag's name. This is the combination of prefix and
 * global name. For instance ``<a:b>`` would have ``"a:b"`` for ``name``.
 *
 * @property {string} prefix The tag's prefix. For instance ``<a:b>`` would have
 * ``"a"`` for ``prefix``. Undefined if we do not track namespaces.
 *
 * @property {string} local The tag's local name. For instance ``<a:b>`` would
 * have ``"b"`` for ``local``. Undefined if we do not track namespaces.
 *
 * @property {string} uri The namespace URI of this tag. Undefined if we do not
 * track namespaces.
 *
 * @property {Object.<string, SaxesAttribute> | Object.<string, string>}
 * attributes A map of attribute name to attributes. If namespaces are tracked,
 * the values in the map are {@link SaxesAttribute SaxesAttribute}
 * objects. Otherwise, they are strings.
 *
 * @property {Object.<string, string>} ns The namespace bindings in effect.
 *
 * @property {boolean} selfClosing Whether the tag is
 * self-closing (e.g. ``<foo/>``).
 *
 */

/**
 * Data structure for an XML attribute
 *
 * @typedef {object} SaxesAttribute
 *
 * @property {string} name The attribute's name. This is the combination of
 * prefix and local name. For instance ``a:b="c"`` would have ``a:b`` for name.
 *
 * @property {string} prefix The attribute's prefix. For instance ``a:b="c"``
 * would have ``"a"`` for ``prefix``.
 *
 * @property {string} local The attribute's local name. For instance ``a:b="c"``
 * would have ``"b"`` for ``local``.
 *
 * @property {string} uri The namespace URI of this attribute.
 *
 * @property {string} value The attribute's value.
 */

/**
 * @typedef ChunkState
 *
 * @private
 *
 * @property {string} chunk The chunk being read. This is readonly.
 *
 * @property {number} limit The size of the chunk. This is readonly.
 *
 * @property {number} i The offset into the chunk at which we are to read the
 * next character.
 */

/**
 * @typedef XMLDecl
 *
 * @property {string} [version] The version specified by the XML declaration.
 *
 * @property {string} [encoding] The encoding specified by the XML declaration.
 *
 * @property {string} [standalone] The value of the standalone parameter
 * specified by the XML declaration.
 */

/**
 * @typedef SaxesOptions
 *
 * @property {boolean} [xmlns] Whether to track namespaces. Unset means
 *``false``.
 *
 * @property {boolean} [position] Whether to track positions. Unset means
 *``true``.
 *
 * @property {string} [fileName] A file name to use for error reporting. Leaving
 * this unset will report a file name of "undefined". "File name" is a loose
 * concept. You could use a URL to some resource, or any descriptive name you
 * like.
 */

class SaxesParser {
  /**
   * @param {SaxesOptions} opt The parser options.
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

    /**
     * The options passed to the constructor of this parser.
     *
     * @type {SaxesOptions}
     */
    this.opt = opt || {};

    /**
     * Indicates whether or not the parser is closed. If ``true``, wait for
     * the ``ready`` event to write again.
     *
     * @type {boolean}
     */
    this.closed = false;

    /**
     * The XML declaration for this document.
     *
     * @type {XMLDecl}
     */
    this.xmlDecl = {
      version: undefined,
      encoding: undefined,
      standalone: undefined,
    };

    this.q = null;
    this.tags = [];
    this.initial = true;
    this.closedRoot = this.sawRoot = this.inRoot = false;
    this.tag = null;
    this.state = S_BEGIN_WHITESPACE;
    /**
     * A map of entity name to expansion.
     *
     * @type {Object.<string, string>}
     */
    this.ENTITIES = Object.create(XML_ENTITIES);
    this.attribList = [];
    this.reportedTextBeforeRoot = false;
    this.reportedTextAfterRoot = false;
    this.xmlDeclPossible = true;
    this.piIsXMLDecl = false;
    this.xmlDeclState = S_XML_DECL_NAME_START;
    this.xmlDeclExpects = ["version"];
    this.requiredSeparator = undefined;
    this.entityBufferName = undefined;
    this.entityReturnState = undefined;
    // This records the index before which we don't have to check for the
    // presence of ]]]>. The text before that index has been checked already,
    // and should not be checked twice.
    this.textNodeCheckedBefore = 0;

    // namespaces form a prototype chain.
    // it always points at the current tag,
    // which protos to its parent tag.
    if (this.opt.xmlns) {
      this.ns = Object.assign({}, rootNS);
    }

    this.startTagPosition = undefined;

    this.trackPosition = this.opt.position !== false;
    if (this.trackPosition) {
      /** The line number the parser is  currently looking at. */
      this.line = 1;

      /** The stream position the parser is currently looking at. */
      this.position = 0;

      /** The column the parser is currently looking at. */
      this.column = 0;

      this.fileName = this.opt.fileName;
    }
    this.onready();
  }

  /* eslint-disable class-methods-use-this */
  /**
   * Event handler for text data. The default implementation is a no-op.
   *
   * @param {string} text The text data encountered by the parser.
   *
   */
  ontext() {}

  /**
   * Event handler for processing instructions. The default implementation is a
   * no-op.
   *
   * @param {{target: string, body: string}} data The target and body of
   * the processing instruction.
   */
  onprocessinginstruction() {}

  /**
   * Event handler for doctype. The default implementation is a no-op.
   *
   * @param {string} doctype The doctype contents.
   */
  ondoctype() {}

  /**
   * Event handler for comments. The default implementation is a no-op.
   *
   * @param {string} comment The comment contents.
   */
  oncomment() {}

  /**
   * Event handler for the start of an open tag. This is called as soon as we
   * have a tag name. The default implementation is a no-op.
   *
   * @param {SaxesTag} tag The tag.
   */
  onopentagstart() {}

  /**
   * Event handler for an open tag. This is called when the open tag is
   * complete. (We've encountered the ">" that ends the open tag.) The default
   * implementation is a no-op.
   *
   * @param {SaxesTag} tag The tag.
   */
  onopentag() {}

  /**
   * Event handler for a close tag. Note that for self-closing tags, this is
   * called right after ``onopentag``. The default implementation is a no-op.
   *
   * @param {SaxesTag} tag The tag.
   */
  onclosetag() {}

  /**
   * Event handler for a CDATA section. This is called when ending the
   * CDATA section. The default implementation is a no-op.
   *
   * @param {string} cdata The contents of the CDATA section.
   */
  oncdata() {}

  /**
   * Event handler for the stream end. This is called when the stream has been
   * closed with ``close`` or by passing ``null`` to ``write``. The default
   * implementation is a no-op.
   */
  onend() {}

  /**
   * Event handler indicating parser readiness . This is called when the parser
   * is ready to parse a new document.  The default implementation is a no-op.
   */
  onready() {}

  /**
   * Event handler indicating an error. The default implementation throws the
   * error. Override with a no-op handler if you don't want this.
   *
   * @param {Error} err The error that occurred.
   */
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

    // We checked if performing a pre-decomposition of the string into an array
    // of single complete characters (``Array.from(chunk)``) would be faster
    // than the current repeated calls to ``codePointAt``. As of August 2018, it
    // isn't. (There may be Node-specific code that would perform faster than
    // ``Array.from`` but don't want to be dependent on Node.)
    const limit = chunk.length;
    const chunkState = {
      chunk,
      limit,
      i: 0,
    };
    while (chunkState.i < limit) {
      this[this.state].call(this, chunkState);
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
   * Get a single code point out of the current chunk. This updates the current
   * position if we do position tracking.
   *
   * @private
   *
   * @param {ChunkState} chunkState The chunk state.
   *
   * @returns {number} The character read.
   */
  getCode(chunkState) {
    const code = chunkState.chunk.codePointAt(chunkState.i);

    if (!isChar(code)) {
      this.fail("disallowed character.");
    }

    const skip = code <= 0xFFFF ? 1 : 2;
    chunkState.i += skip;

    if (code && this.trackPosition) {
      this.position += skip;
      if (code === NL) {
        this.line++;
        this.column = 0;
      }
      else {
        this.column += skip;
      }
    }

    return code;
  }

  /**
   * @callback CharacterTest
   *
   * @private
   *
   * @param {string} c The character to test.
   *
   * @returns {boolean} ``true`` if the method should continue capturing text,
   * ``false`` otherwise.
   */

  /**
   * Capture characters into a buffer while a condition is true. A sequence of
   * ``write`` calls may require the capture of text into a buffer as multiple
   * "fragments". For instance, given ``write("<x>Multiple")`` and
   * ``write("parts</x>")``, the text which is part of the ``x`` element will be
   * recorded in two steps: one recording ``"Multiple"`` and one recording
   * ``"parts"``. These are two fragments.
   *
   * @private
   *
   * @param {ChunkState} chunkState The current chunk state.
   *
   * @param {CharacterTest} test A test to perform on each character. The
   * capture ends when the test returns false.
   *
   * @param {string} buffer The name of the buffer to save into.
   *
   * @return {string|undefined} The character that made the test fail, or
   * ``undefined`` if we hit the end of the chunk.
   */
  captureWhile(chunkState, test, buffer) {
    const { limit, chunk, i: start } = chunkState;
    while (chunkState.i < limit) {
      const c = this.getCode(chunkState);
      if (!test(c)) {
        // This is faster than adding codepoints one by one.
        this[buffer] += chunk.substring(start,
                                        chunkState.i - (c <= 0xFFFF ? 1 : 2));
        return c;
      }
    }

    // This is faster than adding codepoints one by one.
    this[buffer] += chunk.substring(start);
    return undefined;
  }

  /**
   * Skip characters while a condition is true.
   *
   * @private
   *
   * @param {ChunkState} chunkState Chunk information
   *
   * @param {CharacterTest} test A test to perform on each character. The skip
   * ends when the test returns false.
   *
   * @return {string|undefined} The character that made the test fail, or
   * ``undefined`` if we hit the end of the chunk.
   */
  skipWhile(chunkState, test) {
    const { limit } = chunkState;
    while (chunkState.i < limit) {
      const c = this.getCode(chunkState);
      if (!test(c)) {
        return c;
      }
    }

    return undefined;
  }

  /**
   * Skip whitespace characters.
   *
   * @private
   *
   * @param {ChunkState} chunkState The current chunk state.
   *
   * @return {string|undefined} The character that made the test fail, or
   * ``undefined`` if we hit the end of the chunk.
   */
  skipWhitespace(chunkState) {
    const { limit } = chunkState;
    while (chunkState.i < limit) {
      const c = this.getCode(chunkState);
      if (!isS(c)) {
        return c;
      }
    }

    return undefined;
  }


  // STATE HANDLERS

  /** @private */
  sBeginWhitespace(chunkState) {
    const { limit } = chunkState;
    let c = this.getCode(chunkState);
    if (this.initial && c === 0xFEFF) {
      this.initial = false;
      if (chunkState.i >= limit) {
        return;
      }
      c = this.getCode(chunkState);
    }
    else {
      this.initial = false;
    }
    // We cannot use skipWhile here because we have to use the previously
    // read character first.
    while (chunkState.i < limit && isS(c)) {
      c = this.getCode(chunkState);
      this.xmlDeclPossible = false;
    }
    if (c === LESS) {
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
      this.textNode = String.fromCodePoint(c);
      this.textNodeCheckedBefore = 0;
      this.state = S_TEXT;
      this.xmlDeclPossible = false;
    }
  }

  /** @private */
  sText(chunkState) {
    const c = this.captureWhile(chunkState,
                                cx => cx !== LESS && cx !== AMP,
                                "textNode");

    if (!this.inRoot && (/\S/.test(this.textNode) || c === AMP)) {
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

    if (this.textNode.includes("]]>", this.textNodeCheckedBefore)) {
      this.fail("the string \"]]>\" is disallowed in char data.");
    }

    // We have to go back two spaces so that we can catch the case where on a
    // previous write call, the textNode buffer ended on ``]]`` and we started
    // with ``>`` this time around.
    this.textNodeCheckedBefore = this.textNode.length - 2;

    switch (c) {
    case LESS:
      this.state = S_OPEN_WAKA;
      this.startTagPosition = this.position;
      break;
    case AMP:
      this.state = S_ENTITY;
      this.entityBufferName = "textNode";
      this.entityReturnState = S_TEXT;
      break;
    default:
    }
  }

  /** @private */
  sOpenWaka(chunkState) {
    const c = this.getCode(chunkState);
    // either a /, ?, !, or text is coming next.
    if (isNameStartChar(c)) {
      this.state = S_OPEN_TAG;
      this.tagName = String.fromCodePoint(c);
      this.xmlDeclPossible = false;
    }
    else {
      switch (c) {
      case FORWARD_SLASH:
        this.state = S_CLOSE_TAG;
        this.tagName = "";
        this.xmlDeclPossible = false;
        break;
      case BANG:
        this.state = S_OPEN_WAKA_BANG;
        this.openWakaBang = "";
        this.xmlDeclPossible = false;
        break;
      case QUESTION:
        this.state = S_PI;
        this.piTarget = this.piBody = "";
        break;
      default: {
        this.fail("disallowed characer in tag name.");
        // if there was some whitespace, then add that in.
        const pad = (this.startTagPosition + 1 < this.position) ?
              new Array(this.position - this.startTagPosition).join(" ") :
              "";
        this.textNode += `<${pad}${String.fromCodePoint(c)}`;
        this.state = S_TEXT;
        this.xmlDeclPossible = false;
      }
      }
    }
  }

  /** @private */
  sOpenWakaBang(chunkState) {
    const c = String.fromCodePoint(this.getCode(chunkState));
    this.openWakaBang += c;
    switch (this.openWakaBang) {
    case "[CDATA[":
      if (!this.sawRoot && !this.reportedTextBeforeRoot) {
        this.fail("text data outside of root node.");
        this.reportedTextBeforeRoot = true;
      }

      if (this.closedRoot && !this.reportedTextAfterRoot) {
        this.fail("text data outside of root node.");
        this.reportedTextAfterRoot = true;
      }
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
                                cx => cx !== OPEN_BRACKET && !isQuote(cx) &&
                                cx !== GREATER,
                                "doctype");
    if (c === GREATER) {
      this.state = S_TEXT;
      this.emitNode("ondoctype", this.doctype);
      this.doctype = true; // just remember that we saw it.
    }
    else if (c) {
      this.doctype += String.fromCodePoint(c);
      if (c === OPEN_BRACKET) {
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
    const { q } = this;
    const c = this.captureWhile(chunkState, cx => cx !== q, "doctype");
    if (!c || c !== q) {
      return;
    }

    this.doctype += String.fromCodePoint(c);
    this.q = null;
    this.state = S_DOCTYPE;
  }

  /** @private */
  sDoctypeDTD(chunkState) {
    const c = this.captureWhile(chunkState,
                                cx => cx !== CLOSE_BRACKET && !isQuote(cx),
                                "doctype");
    if (!c) {
      return;
    }

    this.doctype += String.fromCodePoint(c);
    if (c === CLOSE_BRACKET) {
      this.state = S_DOCTYPE;
    }
    else if (isQuote(c)) {
      this.state = S_DOCTYPE_DTD_QUOTED;
      this.q = c;
    }
  }

  /** @private */
  sDoctypeDTDQuoted(chunkState) {
    const { q } = this;
    const c = this.captureWhile(chunkState, cx => cx !== q, "doctype");
    if (!c) {
      return;
    }

    this.doctype += String.fromCodePoint(c);
    if (c === q) {
      this.state = S_DOCTYPE_DTD;
      this.q = null;
    }
  }

  /** @private */
  sComment(chunkState) {
    const c = this.captureWhile(chunkState, cx => cx !== MINUS, "comment");
    if (c === MINUS) {
      this.state = S_COMMENT_ENDING;
    }
    else if (c) {
      this.comment += String.fromCodePoint(c);
    }
  }

  /** @private */
  sCommentEnding(chunkState) {
    const c = this.getCode(chunkState);
    if (c === MINUS) {
      this.state = S_COMMENT_ENDED;
      this.emitNode("oncomment", this.comment);
      this.comment = "";
    }
    else {
      this.comment += `-${String.fromCodePoint(c)}`;
      this.state = S_COMMENT;
    }
  }

  /** @private */
  sCommentEnded(chunkState) {
    const c = this.getCode(chunkState);
    if (c !== GREATER) {
      this.fail("malformed comment.");
      // <!-- blah -- bloo --> will be recorded as
      // a comment of " blah -- bloo "
      this.comment += `--${String.fromCodePoint(c)}`;
      this.state = S_COMMENT;
    }
    else {
      this.state = S_TEXT;
    }
  }

  sCData(chunkState) {
    const c = this.captureWhile(chunkState, cx => cx !== CLOSE_BRACKET, "cdata");
    if (!c) {
      return;
    }

    if (c === CLOSE_BRACKET) {
      this.state = S_CDATA_ENDING;
    }
    else {
      this.cdata += String.fromCodePoint(c);
    }
  }

  /** @private */
  sCDataEnding(chunkState) {
    const c = this.getCode(chunkState);
    if (c === CLOSE_BRACKET) {
      this.state = S_CDATA_ENDING_2;
    }
    else {
      this.cdata += `]${String.fromCodePoint(c)}`;
      this.state = S_CDATA;
    }
  }

  /** @private */
  sCDataEnding2(chunkState) {
    const c = this.getCode(chunkState);
    switch (c) {
    case GREATER:
      this.emitNode("oncdata", this.cdata);
      this.cdata = "";
      this.state = S_TEXT;
      break;
    case CLOSE_BRACKET:
      this.cdata += "]";
      break;
    default:
      this.cdata += `]]${String.fromCodePoint(c)}`;
      this.state = S_CDATA;
    }
  }

  /** @private */
  sPI(chunkState) {
    // We have to perform the isNameStartChar check here because we do not feed
    // the first character in piTarget elsehwere.
    let check = this.piTarget.length === 0 ? isNameStartChar : isNameChar;
    const c = this.captureWhile(
      chunkState,
      (cx) => {
        if (cx !== QUESTION && !isS(cx)) {
          if (!(check(cx) &&
                // When namespaces are used, colons are not allowed in entity
                // names.
                // https://www.w3.org/XML/xml-names-19990114-errata.html
                // NE08
                (!this.opt.xmlns || cx !== COLON))) {
            this.fail("disallowed characer in processing instruction name.");
          }

          check = isNameStartChar;
          return true;
        }

        return false;
      },
      "piTarget");

    if (!(c === QUESTION || isS(c))) {
      return;
    }

    this.piIsXMLDecl = this.piTarget === "xml";
    if (this.piIsXMLDecl && !this.xmlDeclPossible) {
      this.fail("an XML declaration must be at the start of the document.");
    }
    this.state = c === QUESTION ? S_PI_ENDING : S_PI_BODY;
  }

  /** @private */
  sPIBody(chunkState) {
    let c;
    if (this.piIsXMLDecl) {
      switch (this.xmlDeclState) {
      case S_XML_DECL_NAME_START:
        c = this.skipWhile(chunkState, (cx) => {
          if (isS(cx)) {
            this.requiredSeparator = undefined;

            return true;
          }

          if (cx !== QUESTION && this.requiredSeparator === SPACE_SEPARATOR) {
            this.fail("whitespace required.");
          }

          this.requiredSeparator = undefined;

          return false;
        });

        // The question mark character is not valid inside any of the XML
        // declaration name/value pairs.
        if (c === QUESTION) {
          this.state = S_PI_ENDING;
          return;
        }

        if (c) {
          this.xmlDeclState = S_XML_DECL_NAME;
          this.xmlDeclName = String.fromCodePoint(c);
        }
        break;
      case S_XML_DECL_NAME:
        c = this.captureWhile(chunkState,
                              cx => cx !== QUESTION && !isS(cx) && cx !== EQUAL,
                              "xmlDeclName");
        // The question mark character is not valid inside any of the XML
        // declaration name/value pairs.
        if (c === QUESTION) {
          this.state = S_PI_ENDING;
          return;
        }
        if (isS(c) || c === EQUAL) {
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

          this.xmlDeclState = (c === EQUAL) ? S_XML_DECL_VALUE_START :
            S_XML_DECL_EQ;
        }
        break;
      case S_XML_DECL_EQ:
        c = this.skipWhitespace(chunkState);
        // The question mark character is not valid inside any of the XML
        // declaration name/value pairs.
        if (c === QUESTION) {
          this.state = S_PI_ENDING;
          return;
        }

        if (c) {
          if (c !== EQUAL) {
            this.fail("value required.");
          }
          this.xmlDeclState = S_XML_DECL_VALUE_START;
        }
        break;
      case S_XML_DECL_VALUE_START:
        c = this.skipWhitespace(chunkState);
        // The question mark character is not valid inside any of the XML
        // declaration name/value pairs.
        if (c === QUESTION) {
          this.state = S_PI_ENDING;
          return;
        }

        if (c) {
          if (!isQuote(c)) {
            this.fail("value must be quoted.");
            this.q = SPACE;
          }
          else {
            this.q = c;
          }
          this.xmlDeclState = S_XML_DECL_VALUE;
          this.xmlDeclValue = "";
        }
        break;
      case S_XML_DECL_VALUE:
        c = this.captureWhile(chunkState,
                              cx => cx !== QUESTION && cx !== this.q,
                              "xmlDeclValue");

        // The question mark character is not valid inside any of the XML
        // declaration name/value pairs.
        if (c === QUESTION) {
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
      if (c === QUESTION) {
        this.state = S_PI_ENDING;
      }
      else if (c) {
        this.piBody = String.fromCodePoint(c);
      }
    }
    else {
      c = this.captureWhile(chunkState, cx => cx !== QUESTION, "piBody");
      // The question mark character is not valid inside any of the XML
      // declaration name/value pairs.
      if (c === QUESTION) {
        this.state = S_PI_ENDING;
      }
    }
  }

  /** @private */
  sPIEnding(chunkState) {
    const c = this.getCode(chunkState);
    if (this.piIsXMLDecl) {
      if (c === GREATER) {
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
    else if (c === GREATER) {
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
    else if (c === QUESTION) {
      // We ran into ?? as part of a processing instruction. We initially
      // took the first ? as a sign that the PI was ending, but it is
      // not. So we have to add it to the body but we take the new ? as a
      // sign that the PI is ending.
      this.piBody += "?";
    }
    else {
      this.piBody += `?${String.fromCodePoint(c)}`;
      this.state = S_PI_BODY;
    }
    this.xmlDeclPossible = false;
  }

  /** @private */
  sOpenTag(chunkState) {
    // We don't need to check with isNameStartChar here because the first
    // character of tagName is fed elsewhere, and the check is done there.
    const c = this.captureWhile(
      chunkState,
      (cx) => {
        if (cx !== GREATER && !isS(cx) && cx !== FORWARD_SLASH) {
          if (!isNameChar(cx)) {
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

    const tag = this.tag = {
      name: this.tagName,
      attributes: Object.create(null),
    };

    if (this.opt.xmlns) {
      tag.ns = Object.create(null);
    }

    this.attribList = [];
    this.emitNode("onopentagstart", tag);

    switch (c) {
    case GREATER:
      this.openTag();
      break;
    case FORWARD_SLASH:
      this.state = S_OPEN_TAG_SLASH;
      break;
    default:
      if (!isS(c)) {
        this.fail("disallowed character in tag name.");
      }
      this.state = S_ATTRIB;
    }
  }

  /** @private */
  sOpenTagSlash(chunkState) {
    const c = this.getCode(chunkState);
    if (c === GREATER) {
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
    if (isNameStartChar(c)) {
      this.attribName = String.fromCodePoint(c);
      this.attribValue = "";
      this.state = S_ATTRIB_NAME;
    }
    else if (c === GREATER) {
      this.openTag();
    }
    else if (c === FORWARD_SLASH) {
      this.state = S_OPEN_TAG_SLASH;
    }
    else {
      this.fail("disallowed character in attribute name.");
    }
  }

  /** @private */
  sAttribName(chunkState) {
    // We don't need to check with isNameStartChar here because the first
    // character of attribute is fed elsewhere, and the check is done there.
    const c = this.captureWhile(
      chunkState,
      (cx) => {
        if (cx !== EQUAL && !isS(cx) && cx !== GREATER) {
          if (!isNameChar(cx)) {
            this.fail("disallowed characer in attribute name.");
          }

          return true;
        }

        return false;
      },
      "attribName");
    if (c === EQUAL) {
      this.state = S_ATTRIB_VALUE;
    }
    else if (isS(c)) {
      this.state = S_ATTRIB_NAME_SAW_WHITE;
    }
    else if (c === GREATER) {
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
    if (c === EQUAL) {
      this.state = S_ATTRIB_VALUE;
    }
    else if (c) {
      this.fail("attribute without value.");
      this.tag.attributes[this.attribName] = "";
      this.attribValue = "";
      this.attribName = "";
      if (c === GREATER) {
        this.openTag();
      }
      else if (isNameStartChar(c)) {
        this.attribName = String.fromCodePoint(c);
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
      this.attribValue = String.fromCodePoint(c);
    }
  }

  /** @private */
  sAttribValueQuoted(chunkState) {
    const { q } = this;
    const c = this.captureWhile(
      chunkState,
      (cx) => {
        if (cx === LESS) {
          this.fail("disallowed character.");
        }
        return cx !== q && cx !== AMP;
      },
      "attribValue");
    if (c === AMP) {
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
      this.q = null;
      this.state = S_ATTRIB_VALUE_CLOSED;
    }
  }

  /** @private */
  sAttribValueClosed(chunkState) {
    const c = this.getCode(chunkState);
    if (isS(c)) {
      this.state = S_ATTRIB;
    }
    else if (isNameStartChar(c)) {
      this.fail("no whitespace between attributes.");
      this.attribName = String.fromCodePoint(c);
      this.attribValue = "";
      this.state = S_ATTRIB_NAME;
    }
    else if (c === GREATER) {
      this.openTag();
    }
    else if (c === FORWARD_SLASH) {
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
        if (cx === LESS) {
          this.fail("disallowed character.");
        }
        return cx !== GREATER && cx !== AMP && !isS(cx);
      },
      "attribValue");
    if (c === AMP) {
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
      if (c === GREATER) {
        this.openTag();
      }
      else {
        this.state = S_ATTRIB;
      }
    }
  }

  /** @private */
  sCloseTag(chunkState) {
    const c = this.captureWhile(chunkState,
                                cx => cx !== GREATER && !isS(cx),
                                "tagName");
    if (c === GREATER) {
      this.closeTag();
    }
    else if (isS(c)) {
      this.state = S_CLOSE_TAG_SAW_WHITE;
    }
  }

  /** @private */
  sCloseTagSawWhite(chunkState) {
    const c = this.skipWhitespace(chunkState);
    if (c === GREATER) {
      this.closeTag();
    }
    else if (c) {
      this.fail("disallowed character in closing tag.");
    }
  }

  /** @private */
  sEntity(chunkState) {
    const c = this.getCode(chunkState);
    if ((this.entity.length ? isNameChar : isEntityStartChar)(c) &&
        // When namespaces are used, colons are not valid in entity
        // names.
        // https://www.w3.org/XML/xml-names-19990114-errata.html
        // NE08
        (!this.opt.xmlns || c !== COLON)) {
      this.entity += String.fromCodePoint(c);
    }
    else if (c === SEMICOLON) {
      this[this.entityBufferName] += this.parseEntity();
      if (this.entityBufferName === "textNode") {
        this.textNodeCheckedBefore = this.textNode.length;
      }
      this.entity = "";
      this.state = this.entityReturnState;
    }
    else {
      this.fail("disallowed character in entity name.");
      this[this.entityBufferName] +=
        `&${this.entity}${String.fromCodePoint(c)}`;
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
    this.textNodeCheckedBefore = 0;
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

  _resolve(prefix, index) {
    if (index < 0) {
      return this.ns[prefix];
    }

    const uri = this.tags[index].ns[prefix];
    return uri !== undefined ? uri : this._resolve(prefix, index - 1);
  }

  resolve(prefix) {
    const uri = this.tag.ns[prefix];
    return uri !== undefined ? uri :
      this._resolve(prefix, this.tags.length - 1);
  }

  /**
   * Parse a qname into its prefix and local name parts.
   *
   * @private
   *
   * @param {string} name The name to parse
   *
   * @param {boolean} [attribute=false] Whether we are in an attribute.
   *
   * @returns {{prefix: string, local: string}}
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
   * ``onopentag``.
   *
   * @param {boolean} [selfClosing=false] Whether the tag is self-closing.
   *
   * @private
   */
  openTag(selfClosing) {
    const { tag } = this;
    if (this.opt.xmlns) {
      // emit namespace binding events
      const { ns } = tag;
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

            ns[local] = uri;
          }
        }
      }

      // add namespace info to tag
      const qn = this.qname(this.tagName);
      tag.prefix = qn.prefix;
      tag.local = qn.local;
      tag.uri = this.resolve(qn.prefix) || "";

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
        const uri = prefix === "" ? "" : (this.resolve(prefix) || "");
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
      }
    }
    else {
      for (const [name, value] of this.attribList) {
        if (this.tag.attributes[name]) {
          this.fail(`duplicate attribute: ${name}.`);
        }
        this.tag.attributes[name] = value;
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
   * ``onclosetag``.
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
      this.emitNode("onclosetag", tag);
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
    if (!isChar(num)) {
      this.fail("malformed character entity.");
      return `&${this.entity};`;
    }

    return char;
  }
}

exports.SaxesParser = SaxesParser;
