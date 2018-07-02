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

function emit(parser, event, data) {
  if (parser[event]) {
    parser[event](data);
  }
}

function closeText(parser) {
  if (parser.textNode) {
    emit(parser, "ontext", parser.textNode);
  }
  parser.textNode = "";
}

function emitNode(parser, nodeType, data) {
  if (parser.textNode) {
    closeText(parser);
  }
  emit(parser, nodeType, data);
}

function error(parser, er) {
  closeText(parser);
  if (parser.trackPosition) {
    er += `\nLine: ${parser.line
        }\nColumn: ${parser.column
        }\nChar: ${parser.c}`;
  }
  er = new Error(er);
  parser.error = er;
  emit(parser, "onerror", er);
  return parser;
}

let Stream;
try {
  // eslint-disable-next-line global-require
  ({ Stream } = require("stream"));
}
catch (ex) {
  Stream = function FakeStream() {};
}

const streamWraps = exports.EVENTS.filter(ev => ev !== "error" && ev !== "end");

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

function fail(parser, message) {
  // eslint-disable-next-line no-use-before-define
  if (!(parser instanceof SAXParser)) {
    throw new Error("bad call to fail");
  }
  error(parser, message);
}

function end(parser) {
  if (parser.sawRoot && !parser.closedRoot) {
    fail(parser, "Unclosed root tag");
  }
  if ((parser.state !== S_BEGIN) &&
      (parser.state !== S_BEGIN_WHITESPACE) &&
      (parser.state !== S_TEXT)) {
    error(parser, "Unexpected end");
  }
  closeText(parser);
  parser.c = "";
  parser.closed = true;
  emit(parser, "onend");
  parser._init(parser.opt);
  return parser;
}

function newTag(parser) {
  const parent = parser.tags[parser.tags.length - 1] || parser;
  const tag = parser.tag = {
    name: parser.tagName,
    attributes: Object.create(null),
  };

  // will be overridden if tag contails an xmlns="foo" or xmlns:foo="bar"
  if (parser.opt.xmlns) {
    tag.ns = parent.ns;
  }
  parser.attribList.length = 0;
  emitNode(parser, "onopentagstart", tag);
}

function qname(name, attribute) {
  let [prefix, local] = (name.indexOf(":") < 0 ? ["", name] : name.split(":"));

  // <x "xmlns"="http://foo">
  if (attribute && name === "xmlns") {
    prefix = "xmlns";
    local = "";
  }

  return { prefix, local };
}

function attrib(parser) {
  if (parser.attribList.indexOf(parser.attribName) !== -1 ||
      parser.tag.attributes[parser.attribName]) {
    parser.attribName = parser.attribValue = "";
    return;
  }

  if (parser.opt.xmlns) {
    const { prefix, local } = qname(parser.attribName, true);

    if (prefix === "xmlns") {
      // namespace binding attribute. push the binding into scope
      if (local === "xml" && parser.attribValue !== XML_NAMESPACE) {
        fail(parser,
             `xml: prefix must be bound to ${XML_NAMESPACE}\n` +
             `Actual: ${parser.attribValue}`);
      }
      else if (local === "xmlns" && parser.attribValue !== XMLNS_NAMESPACE) {
        fail(parser,
             `xmlns: prefix must be bound to ${XMLNS_NAMESPACE}\n` +
             `Actual: ${parser.attribValue}`);
      }
      else {
        const { tag } = parser;
        const parent = parser.tags[parser.tags.length - 1] || parser;
        if (tag.ns === parent.ns) {
          tag.ns = Object.create(parent.ns);
        }
        tag.ns[local] = parser.attribValue;
      }
    }

    // defer onattribute events until all attributes have been seen
    // so any new bindings can take effect. preserve attribute order
    // so deferred events can be emitted in document order
    parser.attribList.push([parser.attribName, parser.attribValue]);
  }
  else {
    // in non-xmlns mode, we can emit the event right away
    parser.tag.attributes[parser.attribName] = parser.attribValue;
    emitNode(parser, "onattribute", {
      name: parser.attribName,
      value: parser.attribValue,
    });
  }

  parser.attribName = parser.attribValue = "";
}

function openTag(parser, selfClosing) {
  if (parser.opt.xmlns) {
    // emit namespace binding events
    const { tag } = parser;

    // add namespace info to tag
    const qn = qname(parser.tagName);
    tag.prefix = qn.prefix;
    tag.local = qn.local;
    tag.uri = tag.ns[qn.prefix] || "";

    if (tag.prefix && !tag.uri) {
      fail(parser, `Unbound namespace prefix: ${
          JSON.stringify(parser.tagName)}`);
      tag.uri = qn.prefix;
    }

    const parent = parser.tags[parser.tags.length - 1] || parser;
    if (tag.ns && parent.ns !== tag.ns) {
      for (const p of Object.keys(tag.ns)) {
        emitNode(parser, "onopennamespace", { prefix: p, uri: tag.ns[p] });
      }
    }

    // handle deferred onattribute events
    // Note: do not apply default ns to attributes:
    //   http://www.w3.org/TR/REC-xml-names/#defaulting
    for (const [name, value] of parser.attribList) {
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
        fail(parser, `Unbound namespace prefix: ${
            JSON.stringify(prefix)}`);
        a.uri = prefix;
      }
      parser.tag.attributes[name] = a;
      emitNode(parser, "onattribute", a);
    }
    parser.attribList.length = 0;
  }

  parser.tag.isSelfClosing = !!selfClosing;

  // process the tag
  parser.sawRoot = true;
  parser.tags.push(parser.tag);
  emitNode(parser, "onopentag", parser.tag);
  if (!selfClosing) {
    parser.state = S_TEXT;
    parser.tag = null;
    parser.tagName = "";
  }
  parser.attribName = parser.attribValue = "";
  parser.attribList.length = 0;
}

function closeTag(parser) {
  if (!parser.tagName) {
    fail(parser, "Weird empty close tag.");
    parser.textNode += "</>";
    parser.state = S_TEXT;
    return;
  }

  // first make sure that the closing tag actually exists.
  // <a><b></c></b></a> will close everything, otherwise.
  let t = parser.tags.length;
  const { tagName } = parser;
  const closeTo = tagName;
  while (t--) {
    const close = parser.tags[t];
    if (close.name !== closeTo) {
      fail(parser, "Unexpected close tag");
    }
    else {
      break;
    }
  }

  if (t < 0) {
    fail(parser, `Unmatched closing tag: ${parser.tagName}`);
    parser.textNode += `</${parser.tagName}>`;
    parser.state = S_TEXT;
    return;
  }
  parser.tagName = tagName;
  let s = parser.tags.length;
  while (s-- > t) {
    const tag = parser.tag = parser.tags.pop();
    parser.tagName = parser.tag.name;
    emitNode(parser, "onclosetag", parser.tagName);

    const x = {};
    // eslint-disable-next-line guard-for-in
    for (const i in tag.ns) {
      x[i] = tag.ns[i];
    }

    const parent = parser.tags[parser.tags.length - 1] || parser;
    if (parser.opt.xmlns && tag.ns !== parent.ns) {
      // remove namespace bindings introduced by tag
      for (const p of Object.keys(tag.ns)) {
        emitNode(parser, "onclosenamespace", { prefix: p, uri: tag.ns[p] });
      }
    }
  }
  if (t === 0) {
    parser.closedRoot = true;
  }
  parser.tagName = parser.attribValue = parser.attribName = "";
  parser.attribList.length = 0;
  parser.state = S_TEXT;
}

function parseEntity(parser) {
  let { entity } = parser;

  if (parser.ENTITIES[entity]) {
    return parser.ENTITIES[entity];
  }

  let num;
  let numStr = "";
  entity = entity.toLowerCase();
  if (entity[0] === "#") {
    if (entity[1] === "x") {
      entity = entity.slice(2);
      num = parseInt(entity, 16);
      numStr = num.toString(16);
    }
    else {
      entity = entity.slice(1);
      num = parseInt(entity);
      numStr = num.toString(10);
    }
  }
  entity = entity.replace(/^0+/, "");
  if (Number.isNaN(num) || numStr.toLowerCase() !== entity) {
    fail(parser, "Invalid character entity");
    return `&${parser.entity};`;
  }

  return String.fromCodePoint(num);
}

function beginWhiteSpace(parser, c) {
  if (c === "<") {
    parser.state = S_OPEN_WAKA;
    parser.startTagPosition = parser.position;
  }
  else if (!isWhitespace(c)) {
    // have to process this as a text node.
    // weird, but happens.
    fail(parser, "Non-whitespace before first tag.");
    parser.textNode = c;
    parser.state = S_TEXT;
  }
}

class SAXParser {
  constructor(opt) {
    this._init(opt);
  }

  _init(opt) {
    const parser = this;
    for (const buffer of buffers) {
      parser[buffer] = "";
    }

    parser.q = parser.c = "";
    parser.opt = opt || {};
    parser.tags = [];
    parser.closed = parser.closedRoot = parser.sawRoot = false;
    parser.tag = parser.error = null;
    parser.state = S_BEGIN;
    parser.ENTITIES = Object.create(XML_ENTITIES);
    parser.attribList = [];

    // namespaces form a prototype chain.
    // it always points at the current tag,
    // which protos to its parent tag.
    if (parser.opt.xmlns) {
      parser.ns = Object.create(rootNS);
    }

    // mostly just for error reporting
    parser.trackPosition = parser.opt.position !== false;
    if (parser.trackPosition) {
      parser.position = parser.line = parser.column = 0;
    }
    emit(parser, "onready");
  }

  end() {
    end(this);
  }

  write(chunk) {
    const parser = this;
    if (this.error) {
      throw this.error;
    }
    if (parser.closed) {
      return error(parser,
                   "Cannot write after close. Assign an onready handler.");
    }
    if (chunk === null) {
      return end(parser);
    }
    if (typeof chunk === "object") {
      chunk = chunk.toString();
    }
    let i = 0;
    let c = "";
    // eslint-disable-next-line no-constant-condition
    while (true) {
      c = chunk[i++] || "";
      parser.c = c;

      if (!c) {
        break;
      }

      if (parser.trackPosition) {
        parser.position++;
        if (c === "\n") {
          parser.line++;
          parser.column = 0;
        }
        else {
          parser.column++;
        }
      }

      switch (parser.state) {
      case S_BEGIN:
        parser.state = S_BEGIN_WHITESPACE;
        if (c === "\uFEFF") {
          continue;
        }
        beginWhiteSpace(parser, c);
        continue;

      case S_BEGIN_WHITESPACE:
        beginWhiteSpace(parser, c);
        continue;

      case S_TEXT:
        if (parser.sawRoot && !parser.closedRoot) {
          const starti = i - 1;
          while (c && c !== "<" && c !== "&") {
            c = chunk[i++] || "";
            if (c && parser.trackPosition) {
              parser.position++;
              if (c === "\n") {
                parser.line++;
                parser.column = 0;
              }
              else {
                parser.column++;
              }
            }
          }
          parser.textNode += chunk.substring(starti, i - 1);
        }
        if (c === "<") {
          parser.state = S_OPEN_WAKA;
          parser.startTagPosition = parser.position;
        }
        else {
          if (!isWhitespace(c)) {
            // We use the reportedTextBeforeRoot and
            // reportedTextAfterRoot flags to avoid reporting errors
            // for every single character that is out of place.
            if (!parser.sawRoot && !parser.reportedTextBeforeRoot) {
              fail(parser, "Text data outside of root node.");
              parser.reportedTextBeforeRoot = true;
            }

            if (parser.closedRoot && !parser.reportedTextAfterRoot) {
              fail(parser, "Text data outside of root node.");
              parser.reportedTextAfterRoot = true;
            }
          }
          if (c === "&") {
            parser.state = S_TEXT_ENTITY;
          }
          else {
            parser.textNode += c;
          }
        }
        continue;

      case S_OPEN_WAKA:
        // either a /, ?, !, or text is coming next.
        if (c === "!") {
          parser.state = S_OPEN_WAKA_BANG;
          parser.openWakaBang = "";
        }
        else if (isWhitespace(c)) {
          // wait for it...
        }
        else if (isMatch(nameStart, c)) {
          parser.state = S_OPEN_TAG;
          parser.tagName = c;
        }
        else if (c === "/") {
          parser.state = S_CLOSE_TAG;
          parser.tagName = "";
        }
        else if (c === "?") {
          parser.state = S_PROC_INST;
          parser.procInstName = parser.procInstBody = "";
        }
        else {
          fail(parser, "Unencoded <");
          // if there was some whitespace, then add that in.
          if (parser.startTagPosition + 1 < parser.position) {
            const pad = parser.position - parser.startTagPosition;
            c = new Array(pad).join(" ") + c;
          }
          parser.textNode += `<${c}`;
          parser.state = S_TEXT;
        }
        continue;

      case S_OPEN_WAKA_BANG:
        if ((parser.openWakaBang + c).toUpperCase() === CDATA) {
          emitNode(parser, "onopencdata");
          parser.state = S_CDATA;
          parser.openWakaBang = "";
          parser.cdata = "";
        }
        else if (parser.openWakaBang + c === "--") {
          parser.state = S_COMMENT;
          parser.comment = "";
          parser.openWakaBang = "";
        }
        else if ((parser.openWakaBang + c).toUpperCase() === DOCTYPE) {
          parser.state = S_DOCTYPE;
          if (parser.doctype || parser.sawRoot) {
            fail(parser,
                 "Inappropriately located doctype declaration");
          }
          parser.doctype = "";
          parser.openWakaBang = "";
        }
        else {
          parser.openWakaBang += c;
          // 7 happens to be the maximum length of the string that can
          // possibly match one of the cases above.
          if (parser.openWakaBang.length >= 7) {
            fail(parser, "Incorrect syntax");
          }
        }
        continue;

      case S_DOCTYPE:
        if (c === ">") {
          parser.state = S_TEXT;
          emitNode(parser, "ondoctype", parser.doctype);
          parser.doctype = true; // just remember that we saw it.
        }
        else {
          parser.doctype += c;
          if (c === "[") {
            parser.state = S_DOCTYPE_DTD;
          }
          else if (isQuote(c)) {
            parser.state = S_DOCTYPE_QUOTED;
            parser.q = c;
          }
        }
        continue;

      case S_DOCTYPE_QUOTED:
        parser.doctype += c;
        if (c === parser.q) {
          parser.q = "";
          parser.state = S_DOCTYPE;
        }
        continue;

      case S_DOCTYPE_DTD:
        parser.doctype += c;
        if (c === "]") {
          parser.state = S_DOCTYPE;
        }
        else if (isQuote(c)) {
          parser.state = S_DOCTYPE_DTD_QUOTED;
          parser.q = c;
        }
        continue;

      case S_DOCTYPE_DTD_QUOTED:
        parser.doctype += c;
        if (c === parser.q) {
          parser.state = S_DOCTYPE_DTD;
          parser.q = "";
        }
        continue;

      case S_COMMENT:
        if (c === "-") {
          parser.state = S_COMMENT_ENDING;
        }
        else {
          parser.comment += c;
        }
        continue;

      case S_COMMENT_ENDING:
        if (c === "-") {
          parser.state = S_COMMENT_ENDED;
          if (parser.comment) {
            emitNode(parser, "oncomment", parser.comment);
          }
          parser.comment = "";
        }
        else {
          parser.comment += `-${c}`;
          parser.state = S_COMMENT;
        }
        continue;

      case S_COMMENT_ENDED:
        if (c !== ">") {
          fail(parser, "Malformed comment");
          // <!-- blah -- bloo --> will be recorded as
          // a comment of " blah -- bloo "
          parser.comment += `--${c}`;
          parser.state = S_COMMENT;
        }
        else {
          parser.state = S_TEXT;
        }
        continue;

      case S_CDATA:
        if (c === "]") {
          parser.state = S_CDATA_ENDING;
        }
        else {
          parser.cdata += c;
        }
        continue;

      case S_CDATA_ENDING:
        if (c === "]") {
          parser.state = S_CDATA_ENDING_2;
        }
        else {
          parser.cdata += `]${c}`;
          parser.state = S_CDATA;
        }
        continue;

      case S_CDATA_ENDING_2:
        if (c === ">") {
          if (parser.cdata) {
            emitNode(parser, "oncdata", parser.cdata);
          }
          emitNode(parser, "onclosecdata");
          parser.cdata = "";
          parser.state = S_TEXT;
        }
        else if (c === "]") {
          parser.cdata += "]";
        }
        else {
          parser.cdata += `]]${c}`;
          parser.state = S_CDATA;
        }
        continue;

      case S_PROC_INST:
        if (c === "?") {
          parser.state = S_PROC_INST_ENDING;
        }
        else if (isWhitespace(c)) {
          parser.state = S_PROC_INST_BODY;
        }
        else {
          parser.procInstName += c;
        }
        continue;

      case S_PROC_INST_BODY:
        if (!parser.procInstBody && isWhitespace(c)) {
          continue;
        }
        else if (c === "?") {
          parser.state = S_PROC_INST_ENDING;
        }
        else {
          parser.procInstBody += c;
        }
        continue;

      case S_PROC_INST_ENDING:
        if (c === ">") {
          emitNode(parser, "onprocessinginstruction", {
            name: parser.procInstName,
            body: parser.procInstBody,
          });
          parser.procInstName = parser.procInstBody = "";
          parser.state = S_TEXT;
        }
        else {
          parser.procInstBody += `?${c}`;
          parser.state = S_PROC_INST_BODY;
        }
        continue;

      case S_OPEN_TAG:
        if (isMatch(nameBody, c)) {
          parser.tagName += c;
        }
        else {
          newTag(parser);
          if (c === ">") {
            openTag(parser);
          }
          else if (c === "/") {
            parser.state = S_OPEN_TAG_SLASH;
          }
          else {
            if (!isWhitespace(c)) {
              fail(parser, "Invalid character in tag name");
            }
            parser.state = S_ATTRIB;
          }
        }
        continue;

      case S_OPEN_TAG_SLASH:
        if (c === ">") {
          openTag(parser, true);
          closeTag(parser);
        }
        else {
          fail(parser, "Forward-slash in opening tag not followed by >");
          parser.state = S_ATTRIB;
        }
        continue;

      case S_ATTRIB:
        // haven't read the attribute name yet.
        if (isWhitespace(c)) {
          continue;
        }
        else if (c === ">") {
          openTag(parser);
        }
        else if (c === "/") {
          parser.state = S_OPEN_TAG_SLASH;
        }
        else if (isMatch(nameStart, c)) {
          parser.attribName = c;
          parser.attribValue = "";
          parser.state = S_ATTRIB_NAME;
        }
        else {
          fail(parser, "Invalid attribute name");
        }
        continue;

      case S_ATTRIB_NAME:
        if (c === "=") {
          parser.state = S_ATTRIB_VALUE;
        }
        else if (c === ">") {
          fail(parser, "Attribute without value");
          parser.attribValue = parser.attribName;
          attrib(parser);
          openTag(parser);
        }
        else if (isWhitespace(c)) {
          parser.state = S_ATTRIB_NAME_SAW_WHITE;
        }
        else if (isMatch(nameBody, c)) {
          parser.attribName += c;
        }
        else {
          fail(parser, "Invalid attribute name");
        }
        continue;

      case S_ATTRIB_NAME_SAW_WHITE:
        if (c === "=") {
          parser.state = S_ATTRIB_VALUE;
        }
        else if (isWhitespace(c)) {
          continue;
        }
        else {
          fail(parser, "Attribute without value");
          parser.tag.attributes[parser.attribName] = "";
          parser.attribValue = "";
          emitNode(parser, "onattribute", {
            name: parser.attribName,
            value: "",
          });
          parser.attribName = "";
          if (c === ">") {
            openTag(parser);
          }
          else if (isMatch(nameStart, c)) {
            parser.attribName = c;
            parser.state = S_ATTRIB_NAME;
          }
          else {
            fail(parser, "Invalid attribute name");
            parser.state = S_ATTRIB;
          }
        }
        continue;

      case S_ATTRIB_VALUE:
        if (isWhitespace(c)) {
          continue;
        }
        else if (isQuote(c)) {
          parser.q = c;
          parser.state = S_ATTRIB_VALUE_QUOTED;
        }
        else {
          fail(parser, "Unquoted attribute value");
          parser.state = S_ATTRIB_VALUE_UNQUOTED;
          parser.attribValue = c;
        }
        continue;

      case S_ATTRIB_VALUE_QUOTED:
        if (c !== parser.q) {
          if (c === "&") {
            parser.state = S_ATTRIB_VALUE_ENTITY_Q;
          }
          else {
            parser.attribValue += c;
          }
          continue;
        }
        attrib(parser);
        parser.q = "";
        parser.state = S_ATTRIB_VALUE_CLOSED;
        continue;

      case S_ATTRIB_VALUE_CLOSED:
        if (isWhitespace(c)) {
          parser.state = S_ATTRIB;
        }
        else if (c === ">") {
          openTag(parser);
        }
        else if (c === "/") {
          parser.state = S_OPEN_TAG_SLASH;
        }
        else if (isMatch(nameStart, c)) {
          fail(parser, "No whitespace between attributes");
          parser.attribName = c;
          parser.attribValue = "";
          parser.state = S_ATTRIB_NAME;
        }
        else {
          fail(parser, "Invalid attribute name");
        }
        continue;

      case S_ATTRIB_VALUE_UNQUOTED:
        if (!isAttribEnd(c)) {
          if (c === "&") {
            parser.state = S_ATTRIB_VALUE_ENTITY_U;
          }
          else {
            parser.attribValue += c;
          }
          continue;
        }
        attrib(parser);
        if (c === ">") {
          openTag(parser);
        }
        else {
          parser.state = S_ATTRIB;
        }
        continue;

      case S_CLOSE_TAG:
        if (!parser.tagName) {
          if (isWhitespace(c)) {
            continue;
          }
          else if (notMatch(nameStart, c)) {
            fail(parser, "Invalid tagname in closing tag.");
          }
          else {
            parser.tagName = c;
          }
        }
        else if (c === ">") {
          closeTag(parser);
        }
        else if (isMatch(nameBody, c)) {
          parser.tagName += c;
        }
        else {
          if (!isWhitespace(c)) {
            fail(parser, "Invalid tagname in closing tag");
          }
          parser.state = S_CLOSE_TAG_SAW_WHITE;
        }
        continue;

      case S_CLOSE_TAG_SAW_WHITE:
        if (isWhitespace(c)) {
          continue;
        }
        if (c === ">") {
          closeTag(parser);
        }
        else {
          fail(parser, "Invalid characters in closing tag");
        }
        continue;

      case S_TEXT_ENTITY:
      case S_ATTRIB_VALUE_ENTITY_Q:
      case S_ATTRIB_VALUE_ENTITY_U: {
        let returnState;
        let buffer;
        switch (parser.state) {
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
          parser[buffer] += parseEntity(parser);
          parser.entity = "";
          parser.state = returnState;
        }
        else if (isMatch(parser.entity.length ? entityBody : entityStart, c)) {
          parser.entity += c;
        }
        else {
          fail(parser, "Invalid character in entity name");
          parser[buffer] += `&${parser.entity}${c}`;
          parser.entity = "";
          parser.state = returnState;
        }

        continue;
      }
      default:
        throw new Error(parser, `Unknown state: ${parser.state}`);
      }
    } // while

    return parser;
  }

  resume() {
    this.error = null; return this;
  }

  close() {
    return this.write(null);
  }

  flush() {
    closeText(this);
    if (this.cdata !== "") {
      emitNode(this, "oncdata", this.cdata);
      this.cdata = "";
    }
  }
}

class SAXStream extends Stream {
  constructor(opt) {
    super();

    this._parser = new SAXParser(opt);
    this.writable = true;
    this.readable = true;

    this._parser.onend = () => {
      this.emit("end");
    };

    this._parser.onerror = (er) => {
      this.emit("error", er);

      // if didn't throw, then means error was handled.
      // go ahead and clear error, so we can write again.
      this._parser.error = null;
    };

    this._decoder = null;

    for (const ev of streamWraps) {
      Object.defineProperty(this, `on${ev}`, {
        get() {
          return this._parser[`on${ev}`];
        },
        set(h) {
          if (!h) {
            this.removeAllListeners(ev);
            this._parser[`on${ev}`] = h;
            return;
          }
          this.on(ev, h);
        },
        enumerable: true,
        configurable: false,
      });
    }
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

  on(ev, handler) {
    if (!this._parser[`on${ev}`] && streamWraps.indexOf(ev) !== -1) {
      this._parser[`on${ev}`] = (...args) => {
        this.emit(ev, ...args);
      };
    }

    return Stream.prototype.on.call(this, ev, handler);
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
