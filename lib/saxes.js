// this really needs to be replaced with character classes.  XML allows all
// manner of ridiculous numbers and digits.

"use strict";

const { XML_1_0: { ED5 } } = require("xmlchars");

const {
  regexes: {
    CHAR,
    NAME_START_CHAR,
    NAME_CHAR,
  },
} = ED5;

const CDATA = "[CDATA[";
const DOCTYPE = "DOCTYPE";
const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
const XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";

// We have to make our own regexp because the way we record character references
// as entities. So we have to allow for "#" at the start.
const ENTITY_START_CHAR =
      new RegExp(`^[${ED5.fragments.NAME_START_CHAR}#]$`, "u");

const rootNS = { xml: XML_NAMESPACE, xmlns: XMLNS_NAMESPACE };

const XML_ENTITIES = {
  amp: "&",
  gt: ">",
  lt: "<",
  quot: "\"",
  apos: "'",
};

let S_INDEX = 0;
const S_BEGIN = S_INDEX++; // leading byte order mark or whitespace
const S_BEGIN_WHITESPACE = S_INDEX++; // leading whitespace
const S_TEXT = S_INDEX++; // general stuff
const S_TEXT_ENTITY = S_INDEX++; // &amp and such.
const S_OPEN_WAKA = S_INDEX++; // <
const S_OPEN_WAKA_BANG = S_INDEX++; // <!...
const S_DOCTYPE = S_INDEX++; // <!DOCTYPE
const S_DOCTYPE_QUOTED = S_INDEX++; // <!DOCTYPE "//blah
const S_DOCTYPE_DTD = S_INDEX++; // <!DOCTYPE "//blah" [ ...
const S_DOCTYPE_DTD_QUOTED = S_INDEX++; // <!DOCTYPE "//blah" [ "foo
const S_COMMENT = S_INDEX++; // <!--
const S_COMMENT_ENDING = S_INDEX++; // <!-- blah -
const S_COMMENT_ENDED = S_INDEX++; // <!-- blah --
const S_CDATA = S_INDEX++; // <![CDATA[ something
const S_CDATA_ENDING = S_INDEX++; // ]
const S_CDATA_ENDING_2 = S_INDEX++; // ]]
const S_PI = S_INDEX++; // <?hi
const S_PI_BODY = S_INDEX++; // <?hi there
const S_PI_ENDING = S_INDEX++; // <?hi "there" ?
const S_OPEN_TAG = S_INDEX++; // <strong
const S_OPEN_TAG_SLASH = S_INDEX++; // <strong /
const S_ATTRIB = S_INDEX++; // <a
const S_ATTRIB_NAME = S_INDEX++; // <a foo
const S_ATTRIB_NAME_SAW_WHITE = S_INDEX++; // <a foo _
const S_ATTRIB_VALUE = S_INDEX++; // <a foo=
const S_ATTRIB_VALUE_QUOTED = S_INDEX++; // <a foo="bar
const S_ATTRIB_VALUE_CLOSED = S_INDEX++; // <a foo="bar"
const S_ATTRIB_VALUE_UNQUOTED = S_INDEX++; // <a foo=bar
const S_ATTRIB_VALUE_ENTITY_Q = S_INDEX++; // <foo bar="&quot;"
const S_ATTRIB_VALUE_ENTITY_U = S_INDEX++; // <foo bar=&quot
const S_CLOSE_TAG = S_INDEX++; // </a
const S_CLOSE_TAG_SAW_WHITE = S_INDEX++; // </a   >
const S_XML_DECL_NAME_START = S_INDEX++; // <?xml
const S_XML_DECL_NAME = S_INDEX++; // <?xml foo
const S_XML_DECL_EQ = S_INDEX++; // <?xml foo=
const S_XML_DECL_VALUE_START = S_INDEX++; // <?xml foo=
const S_XML_DECL_VALUE = S_INDEX++; // <?xml foo="bar"

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
  "comment", "openWakaBang", "textNode", "tagName", "doctype", "piTarget",
  "piBody", "entity", "attribName", "attribValue", "cdata", "xmlDeclName",
  "xmlDeclValue"
];

let Stream;
try {
  // eslint-disable-next-line global-require
  ({ Stream } = require("stream"));
}
catch (ex) {
  Stream = function FakeStream() {};
}

function isWhitespace(c) {
  return c === " " || c === "\n" || c === "\r" || c === "\t";
}

function isQuote(c) {
  return c === "\"" || c === "'";
}

function isAttribEnd(c) {
  return c === ">" || isWhitespace(c);
}

function isMatch(regex, c) {
  return regex.test(c);
}

function notMatch(regex, c) {
  return !isMatch(regex, c);
}

class SAXParser {
  constructor(opt) {
    this._init(opt);
  }

  _init(opt) {
    for (const buffer of buffers) {
      this[buffer] = "";
    }

    this.q = this.c = "";
    this.opt = opt || {};
    this.tags = [];
    this.closed = this.closedRoot = this.sawRoot = false;
    this.tag = this.error = null;
    this.state = S_BEGIN;
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
  onerror() {}
  onend() {}
  onready() {}
  onopennamespace() {}
  onclosenamespace() {}
  /* eslint-enable class-methods-use-this */

  end() {
    if (!this.sawRoot) {
      this.fail("document must contain a root element.");
    }
    if (this.sawRoot && !this.closedRoot) {
      this.fail("unclosed root tag.");
    }
    if ((this.state !== S_BEGIN) &&
        (this.state !== S_BEGIN_WHITESPACE) &&
        (this.state !== S_TEXT)) {
      this.fail("unexpected end.");
    }
    this.closeText();
    this.c = "";
    this.closed = true;
    this.onend();
    this._init(this.opt);
    return this;
  }

  fail(er) {
    this.closeText();
    const message = (this.trackPosition) ?
          `${this.fileName}:${this.line}:${this.column}: ${er}` : er;

    this.error = er = new Error(message);
    this.onerror(er);
    return this;
  }

  write(chunk) {
    if (this.error) {
      throw this.error;
    }
    if (this.closed) {
      return this.fail("cannot write after close; assign an onready handler.");
    }
    if (chunk === null) {
      return this.end();
    }
    if (typeof chunk === "object") {
      chunk = chunk.toString();
    }

    let i = 0;
    const limit = chunk.length;
    while (i < limit) {
      let c = String.fromCodePoint(chunk.codePointAt(i));
      i += c.length;
      this.c = c;

      if (this.trackPosition) {
        this.position += c.length;
        if (c === "\n") {
          this.line++;
          this.column = 0;
        }
        else {
          this.column += c.length;
        }
      }

      if (!CHAR.test(c)) {
        this.fail("disallowed character.");
      }

      switch (this.state) {
      case S_BEGIN:
        this.state = S_BEGIN_WHITESPACE;
        if (c === "\uFEFF") {
          continue;
        }
        /* fall through */
      case S_BEGIN_WHITESPACE:
        if (c === "<") {
          this.state = S_OPEN_WAKA;
          this.startTagPosition = this.position;
        }
        else if (!isWhitespace(c)) {
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
        else {
          this.xmlDeclPossible = false;
        }
        continue;

      case S_TEXT:
        if (this.sawRoot && !this.closedRoot) {
          const starti = i - 1;
          while (i < limit && c !== "<" && c !== "&") {
            c = String.fromCodePoint(chunk.codePointAt(i));
            i += c.length;

            if (!CHAR.test(c)) {
              this.fail("disallowed character.");
            }

            if (c && this.trackPosition) {
              this.position++;
              if (c === "\n") {
                this.line++;
                this.column = 0;
              }
              else {
                this.column++;
              }
            }
          }
          const fragment = chunk.substring(starti, i - 1);
          if (fragment.includes("]]>")) {
            this.fail("the string \"]]>\" is disallowed in char data.");
          }
          this.textNode += fragment;
        }
        if (c === "<") {
          this.state = S_OPEN_WAKA;
          this.startTagPosition = this.position;
        }
        else {
          if (!isWhitespace(c)) {
            // We use the reportedTextBeforeRoot and reportedTextAfterRoot flags
            // to avoid reporting errors for every single character that is out
            // of place.
            if (!this.sawRoot && !this.reportedTextBeforeRoot) {
              this.fail("text data outside of root node.");
              this.reportedTextBeforeRoot = true;
            }

            if (this.closedRoot && !this.reportedTextAfterRoot) {
              this.fail("text data outside of root node.");
              this.reportedTextAfterRoot = true;
            }
          }
          if (c === "&") {
            this.state = S_TEXT_ENTITY;
          }
          else {
            this.textNode += c;
          }
        }
        continue;

      case S_OPEN_WAKA:
        // either a /, ?, !, or text is coming next.
        if (c === "!") {
          this.state = S_OPEN_WAKA_BANG;
          this.openWakaBang = "";
          this.xmlDeclPossible = false;
        }
        else if (isMatch(NAME_START_CHAR, c)) {
          this.state = S_OPEN_TAG;
          this.tagName = c;
          this.xmlDeclPossible = false;
        }
        else if (c === "/") {
          this.state = S_CLOSE_TAG;
          this.tagName = "";
          this.xmlDeclPossible = false;
        }
        else if (c === "?") {
          this.state = S_PI;
          this.piTarget = this.piBody = "";
        }
        else {
          this.fail("unencoded <.");
          // if there was some whitespace, then add that in.
          if (this.startTagPosition + 1 < this.position) {
            const pad = this.position - this.startTagPosition;
            c = new Array(pad).join(" ") + c;
          }
          this.textNode += `<${c}`;
          this.state = S_TEXT;
          this.xmlDeclPossible = false;
        }
        continue;

      case S_OPEN_WAKA_BANG:
        if ((this.openWakaBang + c) === CDATA) {
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
        }
        else if (this.openWakaBang + c === "--") {
          this.state = S_COMMENT;
          this.comment = "";
          this.openWakaBang = "";
        }
        else if ((this.openWakaBang + c).toUpperCase() === DOCTYPE) {
          this.state = S_DOCTYPE;
          if (this.doctype || this.sawRoot) {
            this.fail("inappropriately located doctype declaration.");
          }
          this.doctype = "";
          this.openWakaBang = "";
        }
        else {
          this.openWakaBang += c;
          // 7 happens to be the maximum length of the string that can possibly
          // match one of the cases above.
          if (this.openWakaBang.length >= 7) {
            this.fail("incorrect syntax.");
          }
        }
        continue;

      case S_DOCTYPE:
        if (c === ">") {
          this.state = S_TEXT;
          this.emitNode("ondoctype", this.doctype);
          this.doctype = true; // just remember that we saw it.
        }
        else {
          this.doctype += c;
          if (c === "[") {
            this.state = S_DOCTYPE_DTD;
          }
          else if (isQuote(c)) {
            this.state = S_DOCTYPE_QUOTED;
            this.q = c;
          }
        }
        continue;

      case S_DOCTYPE_QUOTED:
        this.doctype += c;
        if (c === this.q) {
          this.q = "";
          this.state = S_DOCTYPE;
        }
        continue;

      case S_DOCTYPE_DTD:
        this.doctype += c;
        if (c === "]") {
          this.state = S_DOCTYPE;
        }
        else if (isQuote(c)) {
          this.state = S_DOCTYPE_DTD_QUOTED;
          this.q = c;
        }
        continue;

      case S_DOCTYPE_DTD_QUOTED:
        this.doctype += c;
        if (c === this.q) {
          this.state = S_DOCTYPE_DTD;
          this.q = "";
        }
        continue;

      case S_COMMENT:
        if (c === "-") {
          this.state = S_COMMENT_ENDING;
        }
        else {
          this.comment += c;
        }
        continue;

      case S_COMMENT_ENDING:
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
        continue;

      case S_COMMENT_ENDED:
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
        continue;

      case S_CDATA:
        if (c === "]") {
          this.state = S_CDATA_ENDING;
        }
        else {
          this.cdata += c;
        }
        continue;

      case S_CDATA_ENDING:
        if (c === "]") {
          this.state = S_CDATA_ENDING_2;
        }
        else {
          this.cdata += `]${c}`;
          this.state = S_CDATA;
        }
        continue;

      case S_CDATA_ENDING_2:
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
        continue;

      case S_PI:
        if (c === "?" || isWhitespace(c)) {
          this.piIsXMLDecl = this.piTarget === "xml";
          if (this.piIsXMLDecl && !this.xmlDeclPossible) {
            this.fail(
              "an XML declaration must be at the start of the document.");
          }
          this.state = c === "?" ? S_PI_ENDING : S_PI_BODY;
        }
        else {
          if (!(isMatch(this.piTarget.length ?
                        NAME_CHAR : NAME_START_CHAR, c) &&
                // When namespaces are used, colons are not allowed in entity
                // names.
                // https://www.w3.org/XML/xml-names-19990114-errata.html
                // NE08
                (!this.opt.xmlns || c !== ":"))) {
            this.fail("disallowed characer in processing instruction name.");
          }
          this.piTarget += c;
        }
        continue;

      case S_PI_BODY:
        // The question mark character is not valid inside any of the XML
        // delcaration name/value pairs.
        if (c === "?") {
          this.state = S_PI_ENDING;
        }
        else if (this.piIsXMLDecl) {
          switch (this.xmlDeclState) {
          case S_XML_DECL_NAME_START:
            if (!isWhitespace(c)) {
              if (this.requiredSeparator === SPACE_SEPARATOR) {
                this.fail("whitespace required.");
              }
              this.xmlDeclState = S_XML_DECL_NAME;
              this.xmlDeclName = c;
            }

            this.requiredSeparator = undefined;
            break;
          case S_XML_DECL_NAME:
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
            else {
              this.xmlDeclName += c;
            }
            break;
          case S_XML_DECL_EQ:
            if (!isWhitespace(c)) {
              if (c !== "=") {
                this.fail("value required.");
              }
              this.xmlDeclState = S_XML_DECL_VALUE_START;
            }
            break;
          case S_XML_DECL_VALUE_START:
            if (!isWhitespace(c)) {
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
            if (c !== this.q) {
              this.xmlDeclValue += c;
            }
            else {
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
            throw new Error(
              this,
              `Unknown XML declaration state: ${this.xmlDeclState}`);
          }
        }
        else if (!this.piBody && isWhitespace(c)) {
          continue;
        }
        else {
          this.piBody += c;
        }
        continue;

      case S_PI_ENDING:
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
            // delcaration name/value pairs.
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
        continue;

      case S_OPEN_TAG:
        if (isMatch(NAME_CHAR, c)) {
          this.tagName += c;
        }
        else {
          this.newTag();
          if (c === ">") {
            this.openTag();
          }
          else if (c === "/") {
            this.state = S_OPEN_TAG_SLASH;
          }
          else {
            if (!isWhitespace(c)) {
              this.fail("disallowed character in tag name.");
            }
            this.state = S_ATTRIB;
          }
        }
        continue;

      case S_OPEN_TAG_SLASH:
        if (c === ">") {
          this.openTag(true);
          this.closeTag();
        }
        else {
          this.fail("forward-slash in opening tag not followed by >.");
          this.state = S_ATTRIB;
        }
        continue;

      case S_ATTRIB:
        // haven't read the attribute name yet.
        if (isWhitespace(c)) {
          continue;
        }
        else if (c === ">") {
          this.openTag();
        }
        else if (c === "/") {
          this.state = S_OPEN_TAG_SLASH;
        }
        else if (isMatch(NAME_START_CHAR, c)) {
          this.attribName = c;
          this.attribValue = "";
          this.state = S_ATTRIB_NAME;
        }
        else {
          this.fail("disallowed character in attribute name.");
        }
        continue;

      case S_ATTRIB_NAME:
        if (c === "=") {
          this.state = S_ATTRIB_VALUE;
        }
        else if (c === ">") {
          this.fail("attribute without value.");
          this.attribList.push([this.attribName, this.attribName]);
          this.attribName = this.attribValue = "";
          this.openTag();
        }
        else if (isWhitespace(c)) {
          this.state = S_ATTRIB_NAME_SAW_WHITE;
        }
        else if (isMatch(NAME_CHAR, c)) {
          this.attribName += c;
        }
        else {
          this.fail("disallowed character in attribute name.");
        }
        continue;

      case S_ATTRIB_NAME_SAW_WHITE:
        if (c === "=") {
          this.state = S_ATTRIB_VALUE;
        }
        else if (isWhitespace(c)) {
          continue;
        }
        else {
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
          else if (isMatch(NAME_START_CHAR, c)) {
            this.attribName = c;
            this.state = S_ATTRIB_NAME;
          }
          else {
            this.fail("disallowed character in attribute name.");
            this.state = S_ATTRIB;
          }
        }
        continue;

      case S_ATTRIB_VALUE:
        if (isWhitespace(c)) {
          continue;
        }
        else if (isQuote(c)) {
          this.q = c;
          this.state = S_ATTRIB_VALUE_QUOTED;
        }
        else {
          this.fail("unquoted attribute value.");
          this.state = S_ATTRIB_VALUE_UNQUOTED;
          this.attribValue = c;
        }
        continue;

      case S_ATTRIB_VALUE_QUOTED:
        if (c !== this.q) {
          if (c === "&") {
            this.state = S_ATTRIB_VALUE_ENTITY_Q;
          }
          else if (c === "<") {
            this.fail("disallowed character.");
          }
          else {
            this.attribValue += c;
          }
          continue;
        }
        if (this.attribValue.includes("]]>")) {
          this.fail("the string \"]]>\" is disallowed in char data.");
        }
        this.attribList.push([this.attribName, this.attribValue]);
        this.attribName = this.attribValue = "";
        this.q = "";
        this.state = S_ATTRIB_VALUE_CLOSED;
        continue;

      case S_ATTRIB_VALUE_CLOSED:
        if (isWhitespace(c)) {
          this.state = S_ATTRIB;
        }
        else if (c === ">") {
          this.openTag();
        }
        else if (c === "/") {
          this.state = S_OPEN_TAG_SLASH;
        }
        else if (isMatch(NAME_START_CHAR, c)) {
          this.fail("no whitespace between attributes.");
          this.attribName = c;
          this.attribValue = "";
          this.state = S_ATTRIB_NAME;
        }
        else {
          this.fail("disallowed character in attribute name.");
        }
        continue;

      case S_ATTRIB_VALUE_UNQUOTED:
        if (!isAttribEnd(c)) {
          if (c === "&") {
            this.state = S_ATTRIB_VALUE_ENTITY_U;
          }
          else if (c === "<") {
            this.fail("disallowed character.");
          }
          else {
            this.attribValue += c;
          }
          continue;
        }
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
        continue;

      case S_CLOSE_TAG:
        if (!this.tagName) {
          if (notMatch(NAME_START_CHAR, c)) {
            this.fail("disallowed character in closing tag name.");
          }
          else {
            this.tagName = c;
          }
        }
        else if (c === ">") {
          this.closeTag();
        }
        else if (isMatch(NAME_CHAR, c)) {
          this.tagName += c;
        }
        else {
          if (!isWhitespace(c)) {
            this.fail("disallowed character in closing tag name.");
          }
          this.state = S_CLOSE_TAG_SAW_WHITE;
        }
        continue;

      case S_CLOSE_TAG_SAW_WHITE:
        if (isWhitespace(c)) {
          continue;
        }
        if (c === ">") {
          this.closeTag();
        }
        else {
          this.fail("disallowed character in closing tag.");
        }
        continue;

      case S_TEXT_ENTITY:
      case S_ATTRIB_VALUE_ENTITY_Q:
      case S_ATTRIB_VALUE_ENTITY_U: {
        let returnState;
        let buffer;
        switch (this.state) {
        case S_TEXT_ENTITY:
          returnState = S_TEXT;
          buffer = "textNode";
          break;

        case S_ATTRIB_VALUE_ENTITY_Q:
          returnState = S_ATTRIB_VALUE_QUOTED;
          buffer = "attribValue";
          break;

        case S_ATTRIB_VALUE_ENTITY_U:
          returnState = S_ATTRIB_VALUE_UNQUOTED;
          buffer = "attribValue";
          break;

        default:
        }

        if (c === ";") {
          this[buffer] += this.parseEntity();
          this.entity = "";
          this.state = returnState;
        }
        else if (isMatch(this.entity.length ?
                         NAME_CHAR : ENTITY_START_CHAR, c) &&
                 // When namespaces are used, colons are not valid in entity
                 // names.
                 // https://www.w3.org/XML/xml-names-19990114-errata.html
                 // NE08
                 (!this.opt.xmlns || c !== ":")) {
          this.entity += c;
        }
        else {
          this.fail("disallowed character in entity name.");
          this[buffer] += `&${this.entity}${c}`;
          this.entity = "";
          this.state = returnState;
        }

        continue;
      }
      default:
        throw new Error(this, `Unknown state: ${this.state}`);
      }
    } // while

    return this;
  }

  resume() {
    this.error = null;
    return this;
  }

  close() {
    return this.write(null);
  }

  flush() {
    this.closeText();
    if (this.cdata !== "") {
      this.this.emitNode("oncdata", this.cdata);
      this.cdata = "";
    }

    return this;
  }

  closeText() {
    if (this.textNode) {
      this.ontext(this.textNode);
    }
    this.textNode = "";
  }

  emitNode(nodeType, data) {
    if (this.textNode) {
      this.closeText();
    }
    this[nodeType](data);
  }

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

  newTag() {
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
  }

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
    this.tags.push(tag);
    this.emitNode("onopentag", tag);
    if (!selfClosing) {
      this.state = S_TEXT;
      this.tag = null;
      this.tagName = "";
    }
    this.attribName = this.attribValue = "";
  }

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
      this.closedRoot = true;
    }
    this.tagName = this.attribValue = this.attribName = "";
    this.attribList = [];
    this.state = S_TEXT;
  }

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

const streamWraps = exports.EVENTS.filter(ev => ev !== "error");
class SAXStream extends Stream {
  constructor(opt) {
    super();

    this._parser = new SAXParser(opt);
    this.writable = true;
    this.readable = true;

    this._decoder = null;

    for (const ev of streamWraps) {
      // Override the no-op defaults with handlers that emit on the stream.
      this._parser[`on${ev}`] = (...args) => {
        this.emit(ev, ...args);
      };
    }

    this._parser.onerror = (er) => {
      this.emit("error", er);

      // if didn't throw, then means error was handled.
      // go ahead and clear error, so we can write again.
      this._parser.error = null;
    };
  }

  write(data) {
    if (typeof Buffer === "function" &&
        typeof Buffer.isBuffer === "function" &&
        Buffer.isBuffer(data)) {
      if (!this._decoder) {
        // eslint-disable-next-line global-require
        const SD = require("string_decoder").StringDecoder;
        this._decoder = new SD("utf8");
      }
      data = this._decoder.write(data);
    }

    this._parser.write(data.toString());
    this.emit("data", data);
    return true;
  }

  end(chunk) {
    if (chunk && chunk.length) {
      this.write(chunk);
    }
    this._parser.end();
    return true;
  }
}

function createStream(opt) {
  return new SAXStream(opt);
}


exports.parser = function parser(opt) {
  return new SAXParser(opt);
};
exports.SAXParser = SAXParser;
exports.SAXStream = SAXStream;
exports.createStream = createStream;
