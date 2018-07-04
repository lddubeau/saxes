// this really needs to be replaced with character classes.
// XML allows all manner of ridiculous numbers and digits.

"use strict";

const CDATA = "[CDATA[";
const DOCTYPE = "DOCTYPE";
const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
const XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";

// http://www.w3.org/TR/REC-xml/#NT-NameStartChar
// This implementation works on strings, a single character at a time
// as such, it cannot ever support astral-plane characters (10000-EFFFF)
// without a significant breaking change to either this  parser, or the
// JavaScript language.  Implementation of an emoji-capable xml parser
// is left as an exercise for the reader.
const nameStart = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;

const nameBody = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;

const entityStart = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
const entityBody = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;

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
const S_PROC_INST = S_INDEX++; // <?hi
const S_PROC_INST_BODY = S_INDEX++; // <?hi there
const S_PROC_INST_ENDING = S_INDEX++; // <?hi "there" ?
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
  "comment", "openWakaBang", "textNode", "tagName", "doctype",
  "procInstName", "procInstBody", "entity", "attribName",
  "attribValue", "cdata",
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

function qname(name, attribute) {
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
    prefix = name.substr(0, colon);
    local = name.substr(colon + 1);
  }

  return { prefix, local };
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

    // namespaces form a prototype chain.
    // it always points at the current tag,
    // which protos to its parent tag.
    if (this.opt.xmlns) {
      this.ns = Object.create(rootNS);
    }

    // mostly just for error reporting
    this.trackPosition = this.opt.position !== false;
    if (this.trackPosition) {
      this.position = this.line = this.column = 0;
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
    if (this.sawRoot && !this.closedRoot) {
      this.fail("Unclosed root tag");
    }
    if ((this.state !== S_BEGIN) &&
        (this.state !== S_BEGIN_WHITESPACE) &&
        (this.state !== S_TEXT)) {
      this.fail("Unexpected end");
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
    if (this.trackPosition) {
      er += `\nLine: ${this.line
        }\nColumn: ${this.column
        }\nChar: ${this.c}`;
    }
    er = new Error(er);
    this.error = er;
    this.onerror(er);
    return this;
  }

  write(chunk) {
    if (this.error) {
      throw this.error;
    }
    if (this.closed) {
      return this.fail("Cannot write after close. Assign an onready handler.");
    }
    if (chunk === null) {
      return this.end();
    }
    if (typeof chunk === "object") {
      chunk = chunk.toString();
    }
    let i = 0;
    let c = "";
    // eslint-disable-next-line no-constant-condition
    while (true) {
      c = chunk[i++] || "";
      this.c = c;

      if (!c) {
        break;
      }

      if (this.trackPosition) {
        this.position++;
        if (c === "\n") {
          this.line++;
          this.column = 0;
        }
        else {
          this.column++;
        }
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
          this.fail("Non-whitespace before first tag.");
          this.textNode = c;
          this.state = S_TEXT;
        }
        continue;

      case S_TEXT:
        if (this.sawRoot && !this.closedRoot) {
          const starti = i - 1;
          while (c && c !== "<" && c !== "&") {
            c = chunk[i++] || "";
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
          this.textNode += chunk.substring(starti, i - 1);
        }
        if (c === "<") {
          this.state = S_OPEN_WAKA;
          this.startTagPosition = this.position;
        }
        else {
          if (!isWhitespace(c)) {
            // We use the reportedTextBeforeRoot and
            // reportedTextAfterRoot flags to avoid reporting errors
            // for every single character that is out of place.
            if (!this.sawRoot && !this.reportedTextBeforeRoot) {
              this.fail("Text data outside of root node.");
              this.reportedTextBeforeRoot = true;
            }

            if (this.closedRoot && !this.reportedTextAfterRoot) {
              this.fail("Text data outside of root node.");
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
        }
        else if (isWhitespace(c)) {
          // wait for it...
        }
        else if (isMatch(nameStart, c)) {
          this.state = S_OPEN_TAG;
          this.tagName = c;
        }
        else if (c === "/") {
          this.state = S_CLOSE_TAG;
          this.tagName = "";
        }
        else if (c === "?") {
          this.state = S_PROC_INST;
          this.procInstName = this.procInstBody = "";
        }
        else {
          this.fail("Unencoded <");
          // if there was some whitespace, then add that in.
          if (this.startTagPosition + 1 < this.position) {
            const pad = this.position - this.startTagPosition;
            c = new Array(pad).join(" ") + c;
          }
          this.textNode += `<${c}`;
          this.state = S_TEXT;
        }
        continue;

      case S_OPEN_WAKA_BANG:
        if ((this.openWakaBang + c).toUpperCase() === CDATA) {
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
            this.fail("Inappropriately located doctype declaration");
          }
          this.doctype = "";
          this.openWakaBang = "";
        }
        else {
          this.openWakaBang += c;
          // 7 happens to be the maximum length of the string that can
          // possibly match one of the cases above.
          if (this.openWakaBang.length >= 7) {
            this.fail("Incorrect syntax");
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
          this.fail("Malformed comment");
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

      case S_PROC_INST:
        if (c === "?") {
          this.state = S_PROC_INST_ENDING;
        }
        else if (isWhitespace(c)) {
          this.state = S_PROC_INST_BODY;
        }
        else {
          // When namespaces are used, colons are not valid in pi names.
          // https://www.w3.org/XML/xml-names-19990114-errata.html
          // NE08
          if (!(isMatch(this.procInstName.length ? nameBody : nameStart, c) &&
                 // When namespaces are used, colons are not valid in entity names.
                 // https://www.w3.org/XML/xml-names-19990114-errata.html
                 // NE08
                (!this.opt.xmlns || c !== ":"))) {
            this.fail("Invalid characer in processing instruction name.");
          }
          this.procInstName += c;
        }
        continue;

      case S_PROC_INST_BODY:
        if (!this.procInstBody && isWhitespace(c)) {
          continue;
        }
        else if (c === "?") {
          this.state = S_PROC_INST_ENDING;
        }
        else {
          this.procInstBody += c;
        }
        continue;

      case S_PROC_INST_ENDING:
        if (c === ">") {
          this.emitNode("onprocessinginstruction", {
            name: this.procInstName,
            body: this.procInstBody,
          });
          this.procInstName = this.procInstBody = "";
          this.state = S_TEXT;
        }
        else {
          this.procInstBody += `?${c}`;
          this.state = S_PROC_INST_BODY;
        }
        continue;

      case S_OPEN_TAG:
        if (isMatch(nameBody, c)) {
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
              this.fail("Invalid character in tag name");
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
          this.fail("Forward-slash in opening tag not followed by >");
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
        else if (isMatch(nameStart, c)) {
          this.attribName = c;
          this.attribValue = "";
          this.state = S_ATTRIB_NAME;
        }
        else {
          this.fail("Invalid attribute name");
        }
        continue;

      case S_ATTRIB_NAME:
        if (c === "=") {
          this.state = S_ATTRIB_VALUE;
        }
        else if (c === ">") {
          this.fail("Attribute without value");
          this.attribValue = this.attribName;
          this.attrib();
          this.openTag();
        }
        else if (isWhitespace(c)) {
          this.state = S_ATTRIB_NAME_SAW_WHITE;
        }
        else if (isMatch(nameBody, c)) {
          this.attribName += c;
        }
        else {
          this.fail("Invalid attribute name");
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
          this.fail("Attribute without value");
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
          else if (isMatch(nameStart, c)) {
            this.attribName = c;
            this.state = S_ATTRIB_NAME;
          }
          else {
            this.fail("Invalid attribute name");
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
          this.fail("Unquoted attribute value");
          this.state = S_ATTRIB_VALUE_UNQUOTED;
          this.attribValue = c;
        }
        continue;

      case S_ATTRIB_VALUE_QUOTED:
        if (c !== this.q) {
          if (c === "&") {
            this.state = S_ATTRIB_VALUE_ENTITY_Q;
          }
          else {
            this.attribValue += c;
          }
          continue;
        }
        this.attrib();
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
        else if (isMatch(nameStart, c)) {
          this.fail("No whitespace between attributes");
          this.attribName = c;
          this.attribValue = "";
          this.state = S_ATTRIB_NAME;
        }
        else {
          this.fail("Invalid attribute name");
        }
        continue;

      case S_ATTRIB_VALUE_UNQUOTED:
        if (!isAttribEnd(c)) {
          if (c === "&") {
            this.state = S_ATTRIB_VALUE_ENTITY_U;
          }
          else {
            this.attribValue += c;
          }
          continue;
        }
        this.attrib();
        if (c === ">") {
          this.openTag();
        }
        else {
          this.state = S_ATTRIB;
        }
        continue;

      case S_CLOSE_TAG:
        if (!this.tagName) {
          if (isWhitespace(c)) {
            continue;
          }
          else if (notMatch(nameStart, c)) {
            this.fail("Invalid tagname in closing tag.");
          }
          else {
            this.tagName = c;
          }
        }
        else if (c === ">") {
          this.closeTag();
        }
        else if (isMatch(nameBody, c)) {
          this.tagName += c;
        }
        else {
          if (!isWhitespace(c)) {
            this.fail("Invalid tagname in closing tag");
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
          this.fail("Invalid characters in closing tag");
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
        else if (isMatch(this.entity.length ? entityBody : entityStart, c) &&
                 // When namespaces are used, colons are not valid in entity names.
                 // https://www.w3.org/XML/xml-names-19990114-errata.html
                 // NE08
                 (!this.opt.xmlns || c !== ":")) {
          this.entity += c;
        }
        else {
          this.fail("Invalid character in entity name");
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

  attrib() {
    if (this.opt.xmlns) {
      const { prefix, local } = qname(this.attribName, true);

      if (prefix === "xmlns") {
        // namespace binding attribute. push the binding into scope
        if (local === "xml" && this.attribValue !== XML_NAMESPACE) {
          this.fail(`xml: prefix must be bound to ${XML_NAMESPACE}\n` +
                    `Actual: ${this.attribValue}`);
        }
        else if (local === "xmlns" && this.attribValue !== XMLNS_NAMESPACE) {
          this.fail(`xmlns: prefix must be bound to ${XMLNS_NAMESPACE}\n` +
                    `Actual: ${this.attribValue}`);
        }
        else {
          const { tag } = this;
          const parent = this.tags[this.tags.length - 1] || this;
          if (tag.ns === parent.ns) {
            tag.ns = Object.create(parent.ns);
          }
          tag.ns[local] = this.attribValue;
        }
      }
    }

    this.attribList.push([this.attribName, this.attribValue]);
    this.attribName = this.attribValue = "";
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
    this.attribList.length = 0;
    this.emitNode("onopentagstart", tag);
  }

  openTag(selfClosing) {
    if (this.opt.xmlns) {
      // emit namespace binding events
      const { tag } = this;

      // add namespace info to tag
      const qn = qname(this.tagName);
      tag.prefix = qn.prefix;
      tag.local = qn.local;
      tag.uri = tag.ns[qn.prefix] || "";

      if (tag.prefix) {
        if (tag.prefix === "xmlns") {
          this.fail("Tags may not have \"xmlns\" as prefix.");
        }

        if (!tag.uri) {
          this.fail(`Unbound namespace prefix: ${
          JSON.stringify(this.tagName)}`);
          tag.uri = qn.prefix;
        }
      }
      else if (tag.uri === XMLNS_NAMESPACE) {
        this.fail(`The default namespace may not be set to
${XMLNS_NAMESPACE}.`);
      }
      else if (tag.uri === XML_NAMESPACE) {
        this.fail(`The default namespace may not be set to
${XML_NAMESPACE}.`);
      }

      const parent = this.tags[this.tags.length - 1] || this;
      if (tag.ns && parent.ns !== tag.ns) {
        for (const p of Object.keys(tag.ns)) {
          this.emitNode("onopennamespace", { prefix: p, uri: tag.ns[p] });
        }
      }

      // Note: do not apply default ns to attributes:
      //   http://www.w3.org/TR/REC-xml-names/#defaulting
      for (const [name, value] of this.attribList) {
        const { prefix, local } = qname(name, true);
        const uri = prefix === "" ? "" : (tag.ns[prefix] || "");
        const a = {
          name,
          value,
          prefix,
          local,
          uri,
        };

        // if there's any attributes with an undefined namespace,
        // then fail on them now.
        if (prefix && prefix !== "xmlns" && !uri) {
          this.fail(`Unbound namespace prefix: ${
            JSON.stringify(prefix)}`);
          a.uri = prefix;
        }
        this.tag.attributes[name] = a;
        this.emitNode("onattribute", a);
      }
    }
    else {
      for (const [name, value] of this.attribList) {
        const a = { name, value };
        this.tag.attributes[name] = value;
        this.emitNode("onattribute", a);
      }
    }
    this.attribList.length = 0;

    this.tag.isSelfClosing = !!selfClosing;

    // process the tag
    this.sawRoot = true;
    this.tags.push(this.tag);
    this.emitNode("onopentag", this.tag);
    if (!selfClosing) {
      this.state = S_TEXT;
      this.tag = null;
      this.tagName = "";
    }
    this.attribName = this.attribValue = "";
  }

  closeTag() {
    if (!this.tagName) {
      this.fail("Weird empty close tag.");
      this.textNode += "</>";
      this.state = S_TEXT;
      return;
    }

    // first make sure that the closing tag actually exists.
    // <a><b></c></b></a> will close everything, otherwise.
    let t = this.tags.length;
    const { tagName } = this;
    const closeTo = tagName;
    while (t--) {
      const close = this.tags[t];
      if (close.name !== closeTo) {
        this.fail("Unexpected close tag");
      }
      else {
        break;
      }
    }

    if (t < 0) {
      this.fail(`Unmatched closing tag: ${this.tagName}`);
      this.textNode += `</${this.tagName}>`;
      this.state = S_TEXT;
      return;
    }
    this.tagName = tagName;
    let s = this.tags.length;
    while (s-- > t) {
      const tag = this.tag = this.tags.pop();
      this.tagName = this.tag.name;
      this.emitNode("onclosetag", this.tagName);

      const x = {};
      // eslint-disable-next-line guard-for-in
      for (const i in tag.ns) {
        x[i] = tag.ns[i];
      }

      const parent = this.tags[this.tags.length - 1] || this;
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
    this.attribList.length = 0;
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
      if ((entity[1] === "x" || entity[1] === "X") &&
          /^#[x|X][0-9a-fA-F]+$/.test(entity)) {
        num = parseInt(entity.slice(2), 16);
      }
      else if (/^#[0-9]+$/.test(entity)) {
        num = parseInt(entity.slice(1), 10);
      }
    }

    if (Number.isNaN(num) || num > 0x10FFFF) {
      this.fail("Invalid character entity");
      return `&${this.entity};`;
    }

    return String.fromCodePoint(num);
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
      // Override the no-op defaults with handlers that emit on the
      // stream.
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
