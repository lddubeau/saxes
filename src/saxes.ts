import * as ed5 from "xmlchars/xml/1.0/ed5";
import * as ed2 from "xmlchars/xml/1.1/ed2";
import * as NSed3 from "xmlchars/xmlns/1.0/ed3";

// I don't see a way to get this file to lint nicely without spurious warnings,
// without messed up documentation (I don't want extra underscores in variable
// names), short of using @ts-ignore all over the place. So...
/* eslint-disable @typescript-eslint/ban-ts-ignore */

import isS = ed5.isS;
import isChar10 = ed5.isChar;
import isNameStartChar = ed5.isNameStartChar;
import isNameChar = ed5.isNameChar;
import S_LIST = ed5.S_LIST;
import NAME_RE = ed5.NAME_RE;

import isChar11 = ed2.isChar;

import isNCNameStartChar = NSed3.isNCNameStartChar;
import isNCNameChar = NSed3.isNCNameChar;
import NC_NAME_RE = NSed3.NC_NAME_RE;

// eslint-disable-next-line @typescript-eslint/tslint/config
const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
// eslint-disable-next-line @typescript-eslint/tslint/config
const XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";

const rootNS: Record<string, string> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __proto__: null as any,
  xml: XML_NAMESPACE,
  xmlns: XMLNS_NAMESPACE,
};

const XML_ENTITIES: Record<string, string> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __proto__: null as any,
  amp: "&",
  gt: ">",
  lt: "<",
  quot: "\"",
  apos: "'",
};

// EOC: end-of-chunk
const EOC = -1;
const NL_LIKE = -2;

const S_BEGIN_WHITESPACE = "sBeginWhitespace"; // leading whitespace
const S_DOCTYPE = "sDoctype"; // <!DOCTYPE
const S_DOCTYPE_QUOTE = "sDoctypeQuote"; // <!DOCTYPE "//blah
const S_DTD = "sDTD"; // <!DOCTYPE "//blah" [ ...
const S_DTD_QUOTED = "sDTDQuoted"; // <!DOCTYPE "//blah" [ "foo
const S_DTD_OPEN_WAKA = "sDTDOpenWaka";
const S_DTD_OPEN_WAKA_BANG = "sDTDOpenWakaBang";
const S_DTD_COMMENT = "sDTDComment"; // <!--
const S_DTD_COMMENT_ENDING = "sDTDCommentEnding"; // <!-- blah -
const S_DTD_COMMENT_ENDED = "sDTDCommentEnded"; // <!-- blah --
const S_DTD_PI = "sDTDPI"; // <?
const S_DTD_PI_ENDING = "sDTDPIEnding"; // <?hi "there" ?
const S_TEXT = "sText"; // general stuff
const S_ENTITY = "sEntity"; // &amp and such
const S_OPEN_WAKA = "sOpenWaka"; // <
const S_OPEN_WAKA_BANG = "sOpenWakaBang"; // <!...
const S_COMMENT = "sComment"; // <!--
const S_COMMENT_ENDING = "sCommentEnding"; // <!-- blah -
const S_COMMENT_ENDED = "sCommentEnded"; // <!-- blah --
const S_CDATA = "sCData"; // <![CDATA[ something
const S_CDATA_ENDING = "sCDataEnding"; // ]
const S_CDATA_ENDING_2 = "sCDataEnding2"; // ]]
const S_PI_FIRST_CHAR = "sPIFirstChar"; // <?hi, first char
const S_PI_REST = "sPIRest"; // <?hi, rest of the name
const S_PI_BODY = "sPIBody"; // <?hi there
const S_PI_ENDING = "sPIEnding"; // <?hi "there" ?
const S_XML_DECL_NAME_START = "sXMLDeclNameStart"; // <?xml
const S_XML_DECL_NAME = "sXMLDeclName"; // <?xml foo
const S_XML_DECL_EQ = "sXMLDeclEq"; // <?xml foo=
const S_XML_DECL_VALUE_START = "sXMLDeclValueStart"; // <?xml foo=
const S_XML_DECL_VALUE = "sXMLDeclValue"; // <?xml foo="bar"
const S_XML_DECL_ENDING = "sXMLDeclEnding"; // <?xml ... ?
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
] as const;

const TAB = 9;
const NL = 0xA;
const CR = 0xD;
const SPACE = 0x20;
const BANG = 0x21;
const DQUOTE = 0x22;
const AMP = 0x26;
const SQUOTE = 0x27;
const MINUS = 0x2D;
const FORWARD_SLASH = 0x2F;
const SEMICOLON = 0x3B;
const LESS = 0x3C;
const EQUAL = 0x3D;
const GREATER = 0x3E;
const QUESTION = 0x3F;
const OPEN_BRACKET = 0x5B;
const CLOSE_BRACKET = 0x5D;
const NEL = 0x85;
const LS = 0x2028; // Line Separator

const isQuote = (c: number): boolean => c === DQUOTE || c === SQUOTE;

const QUOTES = [DQUOTE, SQUOTE];

const DOCTYPE_TERMINATOR = [...QUOTES, OPEN_BRACKET, GREATER];
const DTD_TERMINATOR = [...QUOTES, LESS, CLOSE_BRACKET];
const XML_DECL_NAME_TERMINATOR = [EQUAL, QUESTION, ...S_LIST];
const ATTRIB_VALUE_UNQUOTED_TERMINATOR = [...S_LIST, GREATER, AMP, LESS];

function nsPairCheck(parser: SaxesParser, prefix: string, uri: string): void {
  switch (prefix) {
    case "xml":
      if (uri !== XML_NAMESPACE) {
        parser.fail(`xml prefix must be bound to ${XML_NAMESPACE}.`);
      }
      break;
    case "xmlns":
      if (uri !== XMLNS_NAMESPACE) {
        parser.fail(`xmlns prefix must be bound to ${XMLNS_NAMESPACE}.`);
      }
      break;
    default:
  }

  switch (uri) {
    case XMLNS_NAMESPACE:
      parser.fail(prefix === "" ?
        `the default namespace may not be set to ${uri}.` :
        `may not assign a prefix (even "xmlns") to the URI \
${XMLNS_NAMESPACE}.`);
      break;
    case XML_NAMESPACE:
      switch (prefix) {
        case "xml":
          // Assinging the XML namespace to "xml" is fine.
          break;
        case "":
          parser.fail(`the default namespace may not be set to ${uri}.`);
          break;
        default:
          parser.fail("may not assign the xml namespace to another prefix.");
      }
      break;
    default:
  }
}


function nsMappingCheck(parser: SaxesParser,
                        mapping: Record<string, string>): void {
  for (const local of Object.keys(mapping)) {
    nsPairCheck(parser, local, mapping[local]);
  }
}

const isNCName = (name: string): boolean => NC_NAME_RE.test(name);

const isName = (name: string): boolean => NAME_RE.test(name);

const FORBIDDEN_START = 0;
const FORBIDDEN_BRACKET = 1;
const FORBIDDEN_BRACKET_BRACKET = 2;

/**
 * This interface defines the structure of attributes when the parser is
 * processing namespaces (created with ``xmlns: true``).
 */
export interface SaxesAttributeNS {
  /**
   * The attribute's name. This is the combination of prefix and local name.
   * For instance ``a:b="c"`` would have ``a:b`` for name.
   */
  name: string;

  /**
   * The attribute's prefix. For instance ``a:b="c"`` would have ``"a"`` for
   * ``prefix``.
   */
  prefix: string;

  /**
   * The attribute's local name. For instance ``a:b="c"`` would have ``"b"`` for
   * ``local``.
   */
  local: string;

  /** The namespace URI of this attribute. */
  uri: string;

  /** The attribute's value. */
  value: string;
}

/**
 * This is an alias for SaxesAttributeNS which will eventually be removed in a
 * future major version.
 *
 * @deprecated
 */
export type SaxesAttribute = SaxesAttributeNS;

/**
 * This interface defines the structure of attributes when the parser is
 * NOT processing namespaces (created with ``xmlns: false``).
 *
 * This is not exported because this structure is used only internally.
 */
interface SaxesAttributePlain {
  /**
   * The attribute's name.
   */
  name: string;

  /** The attribute's value. */
  value: string;
}

/**
 * This are the fields that MAY be present on a complete tag.
 */
export interface SaxesTag {
  /**
   * The tag's name. This is the combination of prefix and global name. For
   * instance ``<a:b>`` would have ``"a:b"`` for ``name``.
   */
  name: string;

  /**
   * A map of attribute name to attributes. If namespaces are tracked, the
   * values in the map are attribute objects. Otherwise, they are strings.
   */
  attributes: Record<string, SaxesAttributeNS | string>;

  /**
   * The namespace bindings in effect.
   */
  ns?: Record<string, string>;

  /**
   * The tag's prefix. For instance ``<a:b>`` would have ``"a"`` for
   * ``prefix``. Undefined if we do not track namespaces.
   */
  prefix?: string;

  /**
   * The tag's local name. For instance ``<a:b>`` would
   * have ``"b"`` for ``local``. Undefined if we do not track namespaces.
   */
  local?: string;

  /**
   * The namespace URI of this tag. Undefined if we do not track namespaces.
   */
  uri?: string;

  /** Whether the tag is self-closing (e.g. ``<foo/>``). */
  isSelfClosing: boolean;
}

/**
 * This type defines the fields that are present on a tag object when
 * ``onopentagstart`` is called. This interface is namespace-agnostic.
 */
export type SaxesStartTag = Pick<SaxesTag, "name" | "attributes" | "ns">;

/**
 * This type defines the fields that are present on a tag object when
 * ``onopentagstart`` is called on a parser that does not processes namespaces.
 */
export type SaxesStartTagPlain = Pick<SaxesStartTag, "name" | "attributes">;

/**
 * This type defines the fields that are present on a tag object when
 * ``onopentagstart`` is called on a parser that does process namespaces.
 */
export type SaxesStartTagNS = Required<SaxesStartTag>;

/**
 * This are the fields that are present on a complete tag produced by a parser
 * that does process namespaces.
 */
export type SaxesTagNS = Required<SaxesTag> & {
  attributes: Record<string, SaxesAttributeNS>;
};

/**
 * This are the fields that are present on a complete tag produced by a parser
 * that does not process namespaces.
 */
export type SaxesTagPlain =
  Pick<SaxesTag, "name" | "attributes" | "isSelfClosing"> & {
    attributes: Record<string, string>;
  };

// This is an internal type used for holding tags while they are being built.
type SaxesTagIncomplete =
  Omit<SaxesTag, "isSelfClosing"> & Partial<Pick<SaxesTag, "isSelfClosing">>;

/**
 * An XML declaration.
 */
export interface XMLDecl {
  /** The version specified by the XML declaration. */
  version?: string;

  /** The encoding specified by the XML declaration. */
  encoding?: string;

  /** The value of the standalone parameter */
  standalone?: string;
}

/**
 * A callback for resolving name prefixes.
 *
 * @param prefix The prefix to check.
 *
 * @returns The URI corresponding to the prefix, if any.
 */
export type ResolvePrefix = (prefix: string) => string | undefined;

export interface CommonOptions {
  /** Whether to accept XML fragments. Unset means ``false``. */
  fragment?: boolean;

  /** Whether to track positions. Unset means ``true``. */
  position?: boolean;

  /**
   * A file name to use for error reporting. "File name" is a loose concept. You
   * could use a URL to some resource, or any descriptive name you like.
   */
  fileName?: string;
}

export interface NSOptions {
  /** Whether to track namespaces. Unset means ``false``. */
  xmlns?: boolean;

  /**
   * A plain object whose key, value pairs define namespaces known before
   * parsing the XML file. It is not legal to pass bindings for the namespaces
   * ``"xml"`` or ``"xmlns"``.
   */
  additionalNamespaces?: Record<string, string>;

  /**
   * A function that will be used if the parser cannot resolve a namespace
   * prefix on its own.
   */
  resolvePrefix?: ResolvePrefix;
}

export interface NSOptionsWithoutNamespaces extends NSOptions {
  xmlns?: false;
  // It makes no sense to set these if namespaces are not used.
  additionalNamespaces?: undefined;
  resolvePrefix?: undefined;
}

export interface NSOptionsWithNamespaces extends NSOptions {
  xmlns: true;
  // The other options are still optional.
}

export interface XMLVersionOptions {
  /**
   * The default XML version to use. If unspecified, and there is no XML
   * encoding declaration, the default version is "1.0".
   */
  defaultXMLVersion?: "1.0" | "1.1";

  /**
   * A flag indicating whether to force the XML version used for parsing to the
   * value of ``defaultXMLVersion``. When this flag is ``true``,
   * ``defaultXMLVersion`` must be specified. If unspecified, the default value
   * of this flag is ``false``.
   */
  forceXMLVersion?: boolean;
}

export interface NoForcedXMLVersion extends XMLVersionOptions {
  forceXMLVersion?: false;
  // defaultXMLVersion stays the same.
}

export interface ForcedXMLVersion extends XMLVersionOptions {
  forceXMLVersion: true;
  // defaultXMLVersion becomes mandatory.
  defaultXMLVersion: Exclude<XMLVersionOptions["defaultXMLVersion"],
  undefined>;
}

export type SaxesOptions =
  CommonOptions &
  (NSOptionsWithNamespaces | NSOptionsWithoutNamespaces) &
  (NoForcedXMLVersion | ForcedXMLVersion);

class SaxesParserImpl {
  private readonly fragmentOpt: boolean;
  private readonly xmlnsOpt: boolean;
  private readonly trackPosition: boolean;
  private readonly fileName?: string;
  private readonly nameStartCheck: (c: number) => boolean;
  private readonly nameCheck: (c: number) => boolean;
  private readonly isName: (name: string) => boolean;
  private readonly ns!: Record<string, string>;

  private openWakaBang!: string;
  private text!: string;
  private name!: string;
  private piTarget!: string;
  private entity!: string;
  private xmlDeclName!: string;
  private q!: null | number;
  private tags!: SaxesTagIncomplete[];
  private tag!: SaxesTagIncomplete | null;
  private chunk!: string;
  private chunkPosition!: number;
  private i!: number;

  //
  // We use prevI to allow "ungetting" the previously read code point. Note
  // however, that it is not safe to unget everything and anything. In
  // particular ungetting EOL characters will screw positioning up.
  //
  // Practically, you must not unget a code which has any side effect beyond
  // updating ``this.i`` and ``this.prevI``. Only EOL codes have such side
  // effects.
  //
  private prevI!: number;
  private carriedFromPrevious?: string;
  private forbiddenState!: number;
  private attribList!: (SaxesAttributeNS | SaxesAttributePlain)[];
  private state!: string;
  private reportedTextBeforeRoot!: boolean;
  private reportedTextAfterRoot!: boolean;
  private closedRoot!: boolean;
  private sawRoot!: boolean;
  private xmlDeclPossible!: boolean;
  private xmlDeclExpects!: string[];
  private requiredSeparator!: boolean;
  private entityReturnState?: string;
  private processAttribs!: (this: this) => void;
  private positionAtNewLine!: number;
  private doctype!: boolean;
  private getCode!: (this: this) => number;
  private isChar!: (c: number) => boolean;
  private pushAttrib!: (this: this, name: string, value: string) => void;
  private _closed!: boolean;

  /**
   * Indicates whether or not the parser is closed. If ``true``, wait for
   * the ``ready`` event to write again.
   */
  get closed(): boolean {
    return this._closed;
  }

  /**
   * The XML declaration for this document.
   */
  xmlDecl!: XMLDecl;

  /** The line number the parser is  currently looking at. */
  line!: number;

  /**
   * A map of entity name to expansion.
   */
  ENTITIES!: Record<string, string>;

  /**
   * @param opt The parser options.
   */
  constructor(readonly opt: SaxesOptions = {}) {
    this.fragmentOpt = !!(this.opt.fragment as boolean);
    const xmlnsOpt = this.xmlnsOpt = !!(this.opt.xmlns as boolean);
    this.trackPosition = this.opt.position !== false;
    this.fileName = this.opt.fileName;

    if (xmlnsOpt) {
      // This is the function we use to perform name checks on PIs and entities.
      // When namespaces are used, colons are not allowed in PI target names or
      // entity names. So the check depends on whether namespaces are used. See:
      //
      // https://www.w3.org/XML/xml-names-19990114-errata.html
      // NE08
      //
      this.nameStartCheck = isNCNameStartChar;
      this.nameCheck = isNCNameChar;
      this.isName = isNCName;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      this.processAttribs = this.processAttribsNS;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.ns = { __proto__: null as any, ...rootNS };
      const additional = this.opt.additionalNamespaces;
      if (additional != null) {
        nsMappingCheck(this, additional);
        Object.assign(this.ns, additional);
      }
    }
    else {
      this.nameStartCheck = isNameStartChar;
      this.nameCheck = isNameChar;
      this.isName = isName;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      this.processAttribs = this.processAttribsPlain;
    }

    this._init();
  }

  _init(): void {
    this.openWakaBang = "";
    this.text = "";
    this.name = "";
    this.piTarget = "";
    this.entity = "";
    this.xmlDeclName = "";

    this.q = null;
    this.tags = [];
    this.tag = null;
    this.chunk = "";
    this.chunkPosition = 0;
    this.i = 0;
    this.prevI = 0;
    this.carriedFromPrevious = undefined;
    this.forbiddenState = FORBIDDEN_START;
    this.attribList = [];

    // The logic is organized so as to minimize the need to check
    // this.opt.fragment while parsing.

    const { fragmentOpt } = this;
    this.state = fragmentOpt ? S_TEXT : S_BEGIN_WHITESPACE;
    // We want these to be all true if we are dealing with a fragment.
    this.reportedTextBeforeRoot = this.reportedTextAfterRoot = this.closedRoot =
      this.sawRoot = fragmentOpt;
    // An XML declaration is intially possible only when parsing whole
    // documents.
    this.xmlDeclPossible = !fragmentOpt;

    this.xmlDeclExpects = ["version"];
    this.requiredSeparator = false;
    this.entityReturnState = undefined;

    let { defaultXMLVersion } = this.opt;
    if (defaultXMLVersion === undefined) {
      if (this.opt.forceXMLVersion === true) {
        throw new Error("forceXMLVersion set but defaultXMLVersion is not set");
      }
      defaultXMLVersion = "1.0";
    }
    this.setXMLVersion(defaultXMLVersion);

    this.positionAtNewLine = 0;

    this.doctype = false;
    this._closed = false;

    this.xmlDecl = {
      version: undefined,
      encoding: undefined,
      standalone: undefined,
    };

    this.line = 1;

    this.ENTITIES = Object.create(XML_ENTITIES);

    this.onready();
  }

  /** The stream position the parser is currently looking at. */
  get position(): number {
    return this.chunkPosition + this.i;
  }

  get column(): number {
    return this.position - this.positionAtNewLine;
  }

  /* eslint-disable class-methods-use-this */
  /* eslint-disable @typescript-eslint/no-unused-vars */
  /* eslint-disable @typescript-eslint/no-empty-function */
  /**
   * Event handler for text data. The default implementation is a no-op.
   *
   * @param text The text data encountered by the parser.
   *
   */
  // @ts-ignore
  ontext(text: string): void {}

  /**
   * Event handler for processing instructions. The default implementation is a
   * no-op.
   *
   * @param data The target and body of the processing instruction.
   */
  // @ts-ignore
  onprocessinginstruction(data: { target: string; body: string }): void {}

  /**
   * Event handler for doctype. The default implementation is a no-op.
   *
   * @param doctype The doctype contents.
   */
  // @ts-ignore
  ondoctype(doctype: string): void {}

  /**
   * Event handler for comments. The default implementation is a no-op.
   *
   * @param comment The comment contents.
   */
  // @ts-ignore
  oncomment(comment: string): void {}

  /**
   * Event handler for the start of an open tag. This is called as soon as we
   * have a tag name. The default implementation is a no-op.
   *
   * @param tag The tag.
   */
  // @ts-ignore
  onopentagstart(tag: SaxesStartTag): void {}

  /**
   * Event handler for an open tag. This is called when the open tag is
   * complete. (We've encountered the ">" that ends the open tag.) The default
   * implementation is a no-op.
   *
   * @param tag The tag.
   */
  // @ts-ignore
  onopentag(tag: SaxesTag): void {}

  /**
   * Event handler for a close tag. Note that for self-closing tags, this is
   * called right after ``onopentag``. The default implementation is a no-op.
   *
   * @param tag The tag.
   */
  // @ts-ignore
  onclosetag(tag: SaxesTag): void {}

  /**
   * Event handler for a CDATA section. This is called when ending the
   * CDATA section. The default implementation is a no-op.
   *
   * @param cdata The contents of the CDATA section.
   */
  // @ts-ignore
  oncdata(cdata: string): void {}

  /**
   * Event handler for the stream end. This is called when the stream has been
   * closed with ``close`` or by passing ``null`` to ``write``. The default
   * implementation is a no-op.
   */
  onend(): void {}

  /**
   * Event handler indicating parser readiness . This is called when the parser
   * is ready to parse a new document.  The default implementation is a no-op.
   */
  onready(): void {}

  /**
   * Event handler indicating an error. The default implementation throws the
   * error. Override with a no-op handler if you don't want this.
   *
   * @param err The error that occurred.
   */
  onerror(err: Error): void {
    throw err;
  }
  /* eslint-enable class-methods-use-this */
  /* eslint-enable @typescript-eslint/no-unused-vars */
  /* eslint-enable @typescript-eslint/no-empty-function */

  /**
   * Report a parsing error. This method is made public so that client code may
   * check for issues that are outside the scope of this project and can report
   * errors.
   *
   * @param er The error to report.
   *
   * @returns this
   */
  fail(er: string): this {
    let message = this.fileName ?? "";
    if (this.trackPosition) {
      if (message.length > 0) {
        message += ":";
      }
      message += `${this.line}:${this.column}`;
    }
    if (message.length > 0) {
      message += ": ";
    }
    message += er;
    this.onerror(new Error(message));
    return this;
  }

  /**
   * Write a XML data to the parser.
   *
   * @param chunk The XML data to write.
   *
   * @returns this
   */
  write(chunk: string | {} | null): this {
    if (this.closed) {
      return this.fail("cannot write after close; assign an onready handler.");
    }

    let end = false;
    if (chunk === null) {
      // We cannot return immediately because carriedFromPrevious may need
      // processing.
      end = true;
      chunk = "";
    }
    else if (typeof chunk === "object") {
      chunk = chunk.toString();
    }

    // We checked if performing a pre-decomposition of the string into an array
    // of single complete characters (``Array.from(chunk)``) would be faster
    // than the current repeated calls to ``charCodeAt``. As of August 2018, it
    // isn't. (There may be Node-specific code that would perform faster than
    // ``Array.from`` but don't want to be dependent on Node.)

    if (this.carriedFromPrevious !== undefined) {
      // The previous chunk had char we must carry over.
      chunk = `${this.carriedFromPrevious}${chunk}`;
      this.carriedFromPrevious = undefined;
    }

    let limit = (chunk as string).length;
    const lastCode = (chunk as string).charCodeAt(limit - 1);
    if (!end &&
        // A trailing CR or surrogate must be carried over to the next
        // chunk.
        (lastCode === CR || (lastCode >= 0xD800 && lastCode <= 0xDBFF))) {
      // The chunk ends with a character that must be carried over. We cannot
      // know how to handle it until we get the next chunk or the end of the
      // stream. So save it for later.
      this.carriedFromPrevious = (chunk as string)[limit - 1];
      limit--;
      chunk = (chunk as string).slice(0, limit);
    }

    this.chunk = chunk as string;
    this.i = 0;
    while (this.i < limit) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any)[this.state]();
    }
    this.chunkPosition += limit;

    return end ? this.end() : this;
  }

  /**
   * Close the current stream. Perform final well-formedness checks and reset
   * the parser tstate.
   *
   * @returns this
   */
  close(): this {
    return this.write(null);
  }

  /**
   * Get a single code point out of the current chunk. This updates the current
   * position if we do position tracking.
   *
   * This is the algorithm to use for XML 1.0.
   *
   * @returns The character read.
   */
  private getCode10(): number {
    const { chunk, i } = this;
    this.prevI = i;
    // Yes, we do this instead of doing this.i++. Doing it this way, we do not
    // read this.i again, which is a bit faster.
    this.i = i + 1;

    if (i >= chunk.length) {
      return EOC;
    }

    // Using charCodeAt and handling the surrogates ourselves is faster
    // than using codePointAt.
    const code = chunk.charCodeAt(i);

    if (code < 0xD800) {
      if (code >= SPACE || code === TAB) {
        return code;
      }

      switch (code) {
        case NL:
          this.line++;
          this.positionAtNewLine = this.position;
          return NL;
        case CR:
          // We may get NaN if we read past the end of the chunk, which is fine.
          if (chunk.charCodeAt(i + 1) === NL) {
            // A \r\n sequence is converted to \n so we have to skip over the
            // next character. We already know it has a size of 1 so ++ is fine
            // here.
            this.i = i + 2;
          }
          // Otherwise, a \r is just converted to \n, so we don't have to skip
          // ahead.

          // In either case, \r becomes \n.
          this.line++;
          this.positionAtNewLine = this.position;
          return NL_LIKE;
        default:
          // If we get here, then code < SPACE and it is not NL CR or TAB.
          this.fail("disallowed character.");
          return code;
      }
    }

    if (code > 0xDBFF) {
      // This is a specialized version of isChar10 that takes into account
      // that in this context code > 0xDBFF and code <= 0xFFFF. So it does not
      // test cases that don't need testing.
      if (!(code >= 0xE000 && code <= 0xFFFD)) {
        this.fail("disallowed character.");
      }

      return code;
    }

    const final = 0x10000 + ((code - 0xD800) * 0x400) +
      (chunk.charCodeAt(i + 1) - 0xDC00);
    this.i = i + 2;

    // This is a specialized version of isChar10 that takes into account that in
    // this context necessarily final >= 0x10000.
    if (final > 0x10FFFF) {
      this.fail("disallowed character.");
    }

    return final;
  }


  /**
   * Get a single code point out of the current chunk. This updates the current
   * position if we do position tracking.
   *
   * This is the algorithm to use for XML 1.1.
   *
   * @returns {number} The character read.
   */
  private getCode11(): number {
    const { chunk, i } = this;
    this.prevI = i;
    // Yes, we do this instead of doing this.i++. Doing it this way, we do not
    // read this.i again, which is a bit faster.
    this.i = i + 1;

    if (i >= chunk.length) {
      return EOC;
    }

    // Using charCodeAt and handling the surrogates ourselves is faster
    // than using codePointAt.
    const code = chunk.charCodeAt(i);

    if (code < 0xD800) {
      if ((code > 0x1F && code < 0x7F) || (code > 0x9F && code !== LS) ||
          code === TAB) {
        return code;
      }

      switch (code) {
        case NL: // 0xA
          this.line++;
          this.positionAtNewLine = this.position;
          return NL;
        case CR: { // 0xD
          // We may get NaN if we read past the end of the chunk, which is
          // fine.
          const next = chunk.charCodeAt(i + 1);
          if (next === NL || next === NEL) {
            // A CR NL or CR NEL sequence is converted to NL so we have to skip
            // over the next character. We already know it has a size of 1.
            this.i = i + 2;
          }
          // Otherwise, a CR is just converted to NL, no skip.
        }
        /* yes, fall through */
        case NEL: // 0x85
        case LS: // Ox2028
          this.line++;
          this.positionAtNewLine = this.position;
          return NL_LIKE;
        default:
          this.fail("disallowed character.");
          return code;
      }
    }

    if (code > 0xDBFF) {
      // This is a specialized version of isCharAndNotRestricted that takes into
      // account that in this context code > 0xDBFF and code <= 0xFFFF. So it
      // does not test cases that don't need testing.
      if (!(code >= 0xE000 && code <= 0xFFFD)) {
        this.fail("disallowed character.");
      }

      return code;
    }

    const final = 0x10000 + ((code - 0xD800) * 0x400) +
      (chunk.charCodeAt(i + 1) - 0xDC00);
    this.i = i + 2;

    // This is a specialized version of isCharAndNotRestricted that takes into
    // account that in this context necessarily final >= 0x10000.
    if (final > 0x10FFFF) {
      this.fail("disallowed character.");
    }

    return final;
  }

  /**
   * Like ``getCode`` but with the return value normalized so that ``NL`` is
   * returned for ``NL_LIKE``.
   */
  private getCodeNorm(): number {
    const c = this.getCode();
    return c === NL_LIKE ? NL : c;
  }

  /**
   * Capture characters into a buffer until encountering one of a set of
   * characters.
   *
   * @param chars An array of codepoints. Encountering a character in the array
   * ends the capture. (``chars`` may safely contain ``NL``.)
   *
   * @return The character code that made the capture end, or ``EOC`` if we hit
   * the end of the chunk. The return value cannot be NL_LIKE: NL is returned
   * instead.
   */
  private captureTo(chars: number[]): number {
    let { i: start } = this;
    const { chunk } = this;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const c = this.getCode();
      const isNLLike = c === NL_LIKE;
      const final = isNLLike ? NL : c;
      if (final === EOC || chars.includes(final)) {
        this.text += chunk.slice(start, this.prevI);
        return final;
      }

      if (isNLLike) {
        this.text += `${chunk.slice(start, this.prevI)}\n`;
        start = this.i;
      }
    }
  }

  /**
   * Capture characters into a buffer until encountering a character.
   *
   * @param char The codepoint that ends the capture. **NOTE ``char`` MAY NOT
   * CONTAIN ``NL``.** Passing ``NL`` will result in buggy behavior.
   *
   * @return ``true`` if we ran into the character. Otherwise, we ran into the
   * end of the current chunk.
   */
  private captureToChar(char: number): boolean {
    let { i: start } = this;
    const { chunk } = this;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let c = this.getCode();
      switch (c) {
        case NL_LIKE:
          this.text += `${chunk.slice(start, this.prevI)}\n`;
          start = this.i;
          c = NL;
          break;
        case EOC:
          this.text += chunk.slice(start);
          return false;
        default:
      }

      if (c === char) {
        this.text += chunk.slice(start, this.prevI);
        return true;
      }
    }
  }

  /**
   * Capture characters that satisfy ``isNameChar`` into the ``name`` field of
   * this parser.
   *
   * @return The character code that made the test fail, or ``EOC`` if we hit
   * the end of the chunk. The return value cannot be NL_LIKE: NL is returned
   * instead.
   */
  private captureNameChars(): number {
    const { chunk, i: start } = this;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const c = this.getCode();
      if (c === EOC) {
        this.name += chunk.slice(start);
        return EOC;
      }

      // NL is not a name char so we don't have to test specifically for it.
      if (!isNameChar(c)) {
        this.name += chunk.slice(start, this.prevI);
        return c === NL_LIKE ? NL : c;
      }
    }
  }

  /**
   * Capture characters into a buffer while ``this.nameCheck`` run on the
   * character read returns true.
   *
   * @param buffer The name of the buffer to save into.
   *
   * @return The character code that made the test fail, or ``EOC`` if we hit
   * the end of the chunk.  The return value cannot be NL_LIKE: NL is returned
   * instead.
   */
  private captureWhileNameCheck(buffer: string): number {
    const { chunk, i: start } = this;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const c = this.getCode();
      if (c === EOC) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any)[buffer] += chunk.slice(start);
        return EOC;
      }

      // NL cannot satisfy this.nameCheck so we don't have to test
      // specifically for it.
      if (!this.nameCheck(c)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any)[buffer] += chunk.slice(start, this.prevI);
        return c === NL_LIKE ? NL : c;
      }
    }
  }

  /**
   * Skip white spaces.
   *
   * @return The character that ended the skip, or ``EOC`` if we hit
   * the end of the chunk. The return value cannot be NL_LIKE: NL is returned
   * instead.
   */
  private skipSpaces(): number {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const c = this.getCodeNorm();
      if (c === EOC || !isS(c)) {
        return c;
      }
    }
  }

  private setXMLVersion(version: string): void {
    /*  eslint-disable @typescript-eslint/unbound-method */
    if (version === "1.0") {
      this.isChar = isChar10;
      this.getCode = this.getCode10;
      this.pushAttrib =
        this.xmlnsOpt ? this.pushAttribNS10 : this.pushAttribPlain;
    }
    else {
      this.isChar = isChar11;
      this.getCode = this.getCode11;
      this.pushAttrib =
        this.xmlnsOpt ? this.pushAttribNS11 : this.pushAttribPlain;
    }
    /* eslint-enable @typescript-eslint/unbound-method */
  }

  // STATE HANDLERS

  // @ts-ignore
  private sBeginWhitespace(): void {
    // We are essentially peeking at the first character of the chunk. Since
    // S_BEGIN_WHITESPACE can be in effect only when we start working on the
    // first chunk, the index at which we must look is necessarily 0. Note also
    // that the following test does not depend on decoding surrogates.

    // If the initial character is 0xFEFF, ignore it.
    if (this.chunk.charCodeAt(0) === 0xFEFF) {
      this.i++;
    }

    // This initial loop is a specialized version of skipSpaces. We need to know
    // whether we've encountered spaces or not because as soon as we run into a
    // space, an XML declaration is no longer possible. Rather than slow down
    // skipSpaces even in places where we don't care whether it skipped anything
    // or not, we use a specialized loop here.
    let c;
    let sawSpace = false;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      c = this.getCodeNorm();
      if (c === EOC || !isS(c)) {
        break;
      }

      sawSpace = true;
    }

    if (sawSpace) {
      this.xmlDeclPossible = false;
    }

    switch (c) {
      case LESS:
        this.state = S_OPEN_WAKA;
        // We could naively call closeText but in this state, it is not normal
        // to have text be filled with any data.
        if (this.text.length !== 0) {
          throw new Error("no-empty text at start");
        }
        break;
      case EOC:
        break;
      default:
        // have to process this as a text node.
        // weird, but happens.
        if (!this.reportedTextBeforeRoot) {
          this.fail("text data outside of root node.");
          this.reportedTextBeforeRoot = true;
        }
        this.i = this.prevI;
        this.state = S_TEXT;
        this.xmlDeclPossible = false;
    }
  }

  // @ts-ignore
  private sText(): void {
    //
    // We did try a version of saxes where the S_TEXT state was split in two
    // states: one for text inside the root element, and one for text
    // outside. This was avoiding having to test this.tags.length to decide what
    // implementation to actually use.
    //
    // Peformance testing on gigabyte-size files did not show any advantage to
    // using the two states solution instead of the current one. Conversely, it
    // made the code a bit more complicated elsewhere. For instance, a comment
    // can appear before the root element so when a comment ended it was
    // necessary to determine whether to return to the S_TEXT state or to the
    // new text-outside-root state.
    //
    if (this.tags.length !== 0) {
      this.handleTextInRoot();
    }
    else {
      this.handleTextOutsideRoot();
    }
  }

  private handleTextInRoot(): void {
    // This is essentially a specialized version of captureTo which is optimized
    // for performing the ]]> check. A previous version of this code, checked
    // ``this.text`` for the presence of ]]>. It simplified the code but was
    // very costly when character data contained a lot of entities to be parsed.
    //
    // Since we are using a specialized loop, we also keep track of the presence
    // of ]]> in text data. The sequence ]]> is forbidden to appear as-is.
    //
    let { i: start, forbiddenState } = this;
    const { chunk } = this;
    // eslint-disable-next-line no-labels, no-restricted-syntax
    scanLoop:
    // eslint-disable-next-line no-constant-condition
    while (true) {
      switch (this.getCode()) {
        case LESS: {
          this.state = S_OPEN_WAKA;
          const { text } = this;
          const slice = chunk.slice(start, this.prevI);
          if (text.length !== 0) {
            this.ontext(text + slice);
            this.text = "";
          }
          else if (slice.length !== 0) {
            this.ontext(slice);
          }
          forbiddenState = FORBIDDEN_START;
          // eslint-disable-next-line no-labels
          break scanLoop;
        }
        case AMP:
          this.state = S_ENTITY;
          this.entityReturnState = S_TEXT;
          this.text += chunk.slice(start, this.prevI);
          forbiddenState = FORBIDDEN_START;
          // eslint-disable-next-line no-labels
          break scanLoop;
        case CLOSE_BRACKET:
          switch (forbiddenState) {
            case FORBIDDEN_START:
              forbiddenState = FORBIDDEN_BRACKET;
              break;
            case FORBIDDEN_BRACKET:
              forbiddenState = FORBIDDEN_BRACKET_BRACKET;
              break;
            case FORBIDDEN_BRACKET_BRACKET:
              break;
            default:
              throw new Error("impossible state");
          }
          break;
        case GREATER:
          if (forbiddenState === FORBIDDEN_BRACKET_BRACKET) {
            this.fail("the string \"]]>\" is disallowed in char data.");
          }
          forbiddenState = FORBIDDEN_START;
          break;
        case NL_LIKE:
          this.text += `${chunk.slice(start, this.prevI)}\n`;
          start = this.i;
          forbiddenState = FORBIDDEN_START;
          break;
        case EOC:
          this.text += chunk.slice(start);
          // eslint-disable-next-line no-labels
          break scanLoop;
        default:
          forbiddenState = FORBIDDEN_START;
      }
    }
    this.forbiddenState = forbiddenState;
  }

  private handleTextOutsideRoot(): void {
    // This is essentially a specialized version of captureTo which is optimized
    // for a specialized task. We keep track of the presence of non-space
    // characters in the text since these are errors when appearing outside the
    // document root element.
    let { i: start } = this;
    const { chunk } = this;
    let nonSpace = false;
    // eslint-disable-next-line no-labels, no-restricted-syntax
    outRootLoop:
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const code = this.getCode();
      switch (code) {
        case LESS: {
          this.state = S_OPEN_WAKA;
          const { text } = this;
          const slice = chunk.slice(start, this.prevI);
          if (text.length !== 0) {
            this.ontext(text + slice);
            this.text = "";
          }
          else if (slice.length !== 0) {
            this.ontext(slice);
          }
          // eslint-disable-next-line no-labels
          break outRootLoop;
        }
        case AMP:
          this.state = S_ENTITY;
          this.entityReturnState = S_TEXT;
          this.text += chunk.slice(start, this.prevI);
          nonSpace = true;
          // eslint-disable-next-line no-labels
          break outRootLoop;
        case NL_LIKE:
          this.text += `${chunk.slice(start, this.prevI)}\n`;
          start = this.i;
          break;
        case EOC:
          this.text += chunk.slice(start);
          // eslint-disable-next-line no-labels
          break outRootLoop;
        default:
          if (!isS(code)) {
            nonSpace = true;
          }
      }
    }

    if (!nonSpace) {
      return;
    }

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

  // @ts-ignore
  private sOpenWaka(): void {
    // Reminder: a state handler is called with at least one character
    // available in the current chunk. So the first call to get code inside of
    // a state handler cannot return ``EOC``. That's why we don't test
    // for it.
    const c = this.getCode();
    // either a /, ?, !, or text is coming next.
    if (isNameStartChar(c)) {
      this.state = S_OPEN_TAG;
      this.i = this.prevI;
      this.xmlDeclPossible = false;
    }
    else {
      switch (c) {
        case FORWARD_SLASH:
          this.state = S_CLOSE_TAG;
          this.xmlDeclPossible = false;
          break;
        case BANG:
          this.state = S_OPEN_WAKA_BANG;
          this.openWakaBang = "";
          this.xmlDeclPossible = false;
          break;
        case QUESTION:
          this.state = S_PI_FIRST_CHAR;
          break;
        default:
          this.fail("disallowed character in tag name");
          this.state = S_TEXT;
          this.xmlDeclPossible = false;
      }
    }
  }

  // @ts-ignore
  private sOpenWakaBang(): void {
    this.openWakaBang += String.fromCodePoint(this.getCodeNorm());
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
        break;
      case "--":
        this.state = S_COMMENT;
        this.openWakaBang = "";
        break;
      case "DOCTYPE":
        this.state = S_DOCTYPE;
        if (this.doctype || this.sawRoot) {
          this.fail("inappropriately located doctype declaration.");
        }
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

  // @ts-ignore
  private sDoctype(): void {
    const c = this.captureTo(DOCTYPE_TERMINATOR);
    switch (c) {
      case GREATER:
        this.ondoctype(this.text);
        this.text = "";
        this.state = S_TEXT;
        this.doctype = true; // just remember that we saw it.
        break;
      case EOC:
        break;
      default:
        this.text += String.fromCodePoint(c);
        if (c === OPEN_BRACKET) {
          this.state = S_DTD;
        }
        else if (isQuote(c)) {
          this.state = S_DOCTYPE_QUOTE;
          this.q = c;
        }
    }
  }

  // @ts-ignore
  private sDoctypeQuote(): void {
    const q = this.q!;
    if (this.captureToChar(q)) {
      this.text += String.fromCodePoint(q);
      this.q = null;
      this.state = S_DOCTYPE;
    }
  }

  // @ts-ignore
  private sDTD(): void {
    const c = this.captureTo(DTD_TERMINATOR);
    if (c === EOC) {
      return;
    }

    this.text += String.fromCodePoint(c);
    if (c === CLOSE_BRACKET) {
      this.state = S_DOCTYPE;
    }
    else if (c === LESS) {
      this.state = S_DTD_OPEN_WAKA;
    }
    else if (isQuote(c)) {
      this.state = S_DTD_QUOTED;
      this.q = c;
    }
  }

  // @ts-ignore
  private sDTDQuoted(): void {
    const q = this.q!;
    if (this.captureToChar(q)) {
      this.text += String.fromCodePoint(q);
      this.state = S_DTD;
      this.q = null;
    }
  }

  // @ts-ignore
  private sDTDOpenWaka(): void {
    const c = this.getCodeNorm();
    this.text += String.fromCodePoint(c);
    switch (c) {
      case BANG:
        this.state = S_DTD_OPEN_WAKA_BANG;
        this.openWakaBang = "";
        break;
      case QUESTION:
        this.state = S_DTD_PI;
        break;
      default:
        this.state = S_DTD;
    }
  }

  // @ts-ignore
  private sDTDOpenWakaBang(): void {
    const char = String.fromCodePoint(this.getCodeNorm());
    const owb = this.openWakaBang += char;
    this.text += char;
    if (owb !== "-") {
      this.state = owb === "--" ? S_DTD_COMMENT : S_DTD;
      this.openWakaBang = "";
    }
  }

  // @ts-ignore
  private sDTDComment(): void {
    if (this.captureToChar(MINUS)) {
      this.text += "-";
      this.state = S_DTD_COMMENT_ENDING;
    }
  }

  // @ts-ignore
  private sDTDCommentEnding(): void {
    const c = this.getCodeNorm();
    this.text += String.fromCodePoint(c);
    this.state = c === MINUS ? S_DTD_COMMENT_ENDED : S_DTD_COMMENT;
  }

  // @ts-ignore
  private sDTDCommentEnded(): void {
    const c = this.getCodeNorm();
    this.text += String.fromCodePoint(c);
    if (c === GREATER) {
      this.state = S_DTD;
    }
    else {
      this.fail("malformed comment.");
      // <!-- blah -- bloo --> will be recorded as
      // a comment of " blah -- bloo "
      this.state = S_DTD_COMMENT;
    }
  }

  // @ts-ignore
  private sDTDPI(): void {
    if (this.captureToChar(QUESTION)) {
      this.text += "?";
      this.state = S_DTD_PI_ENDING;
    }
  }

  // @ts-ignore
  private sDTDPIEnding(): void {
    const c = this.getCodeNorm();
    this.text += String.fromCodePoint(c);
    if (c === GREATER) {
      this.state = S_DTD;
    }
  }

  // @ts-ignore
  private sComment(): void {
    if (this.captureToChar(MINUS)) {
      this.state = S_COMMENT_ENDING;
    }
  }

  // @ts-ignore
  private sCommentEnding(): void {
    const c = this.getCodeNorm();
    if (c === MINUS) {
      this.state = S_COMMENT_ENDED;
      this.oncomment(this.text);
      this.text = "";
    }
    else {
      this.text += `-${String.fromCodePoint(c)}`;
      this.state = S_COMMENT;
    }
  }

  // @ts-ignore
  private sCommentEnded(): void {
    const c = this.getCodeNorm();
    if (c !== GREATER) {
      this.fail("malformed comment.");
      // <!-- blah -- bloo --> will be recorded as
      // a comment of " blah -- bloo "
      this.text += `--${String.fromCodePoint(c)}`;
      this.state = S_COMMENT;
    }
    else {
      this.state = S_TEXT;
    }
  }

  // @ts-ignore
  private sCData(): void {
    if (this.captureToChar(CLOSE_BRACKET)) {
      this.state = S_CDATA_ENDING;
    }
  }

  // @ts-ignore
  private sCDataEnding(): void {
    const c = this.getCodeNorm();
    if (c === CLOSE_BRACKET) {
      this.state = S_CDATA_ENDING_2;
    }
    else {
      this.text += `]${String.fromCodePoint(c)}`;
      this.state = S_CDATA;
    }
  }

  // @ts-ignore
  private sCDataEnding2(): void {
    const c = this.getCodeNorm();
    switch (c) {
      case GREATER:
        this.oncdata(this.text);
        this.text = "";
        this.state = S_TEXT;
        break;
      case CLOSE_BRACKET:
        this.text += "]";
        break;
      default:
        this.text += `]]${String.fromCodePoint(c)}`;
        this.state = S_CDATA;
    }
  }

  // @ts-ignore
  private sPIFirstChar(): void {
    const c = this.getCodeNorm();
    if (this.nameStartCheck(c)) {
      this.piTarget += String.fromCodePoint(c);
      this.state = S_PI_REST;
    }
    else if (c === QUESTION || isS(c)) {
      this.fail("processing instruction without a target.");
      this.state = c === QUESTION ? S_PI_ENDING : S_PI_BODY;
    }
    else {
      this.fail("disallowed character in processing instruction name.");
      this.piTarget += String.fromCodePoint(c);
      this.state = S_PI_REST;
    }
  }

  // @ts-ignore
  private sPIRest(): void {
    const c = this.captureWhileNameCheck("piTarget");
    if (c === QUESTION || isS(c)) {
      if (this.piTarget === "xml") {
        if (!this.xmlDeclPossible) {
          this.fail("an XML declaration must be at the start of the document.");
        }

        this.state = c === QUESTION ? S_XML_DECL_ENDING : S_XML_DECL_NAME_START;
      }
      else {
        this.state = c === QUESTION ? S_PI_ENDING : S_PI_BODY;
      }
    }
    else if (c !== EOC) {
      this.fail("disallowed character in processing instruction name.");
      this.piTarget += String.fromCodePoint(c);
    }
  }

  // @ts-ignore
  private sPIBody(): void {
    if (this.text.length === 0) {
      const c = this.getCodeNorm();
      if (c === QUESTION) {
        this.state = S_PI_ENDING;
      }
      else if (!isS(c)) {
        this.text = String.fromCodePoint(c);
      }
    }
    // The question mark character is not valid inside any of the XML
    // declaration name/value pairs.
    else if (this.captureToChar(QUESTION)) {
      this.state = S_PI_ENDING;
    }
  }

  // @ts-ignore
  private sXMLDeclNameStart(): void {
    let c = this.getCodeNorm();
    if (isS(c)) {
      c = this.skipSpaces();
    }
    else if (this.requiredSeparator && c !== QUESTION) {
      this.fail("whitespace required.");
    }
    this.requiredSeparator = false;

    // The question mark character is not valid inside any of the XML
    // declaration name/value pairs.
    if (c === QUESTION) {
      // This is the only state from which it is valid to go to
      // S_XML_DECL_ENDING.
      this.state = S_XML_DECL_ENDING;
      return;
    }

    if (c !== EOC) {
      this.state = S_XML_DECL_NAME;
      this.xmlDeclName = String.fromCodePoint(c);
    }
  }

  // @ts-ignore
  private sXMLDeclName(): void {
    const c = this.captureTo(XML_DECL_NAME_TERMINATOR);
    // The question mark character is not valid inside any of the XML
    // declaration name/value pairs.
    if (c === QUESTION) {
      this.state = S_XML_DECL_ENDING;
      this.xmlDeclName += this.text;
      this.text = "";
      this.fail("XML declaration is incomplete.");
      return;
    }

    if (!(isS(c) || c === EQUAL)) {
      return;
    }

    this.xmlDeclName += this.text;
    this.text = "";
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

    this.state = c === EQUAL ? S_XML_DECL_VALUE_START : S_XML_DECL_EQ;
  }

  // @ts-ignore
  private sXMLDeclEq(): void {
    const c = this.getCodeNorm();
    // The question mark character is not valid inside any of the XML
    // declaration name/value pairs.
    if (c === QUESTION) {
      this.state = S_XML_DECL_ENDING;
      this.fail("XML declaration is incomplete.");
      return;
    }

    if (isS(c)) {
      return;
    }

    if (c !== EQUAL) {
      this.fail("value required.");
    }

    this.state = S_XML_DECL_VALUE_START;
  }

  // @ts-ignore
  private sXMLDeclValueStart(): void {
    const c = this.getCodeNorm();
    // The question mark character is not valid inside any of the XML
    // declaration name/value pairs.
    if (c === QUESTION) {
      this.state = S_XML_DECL_ENDING;
      this.fail("XML declaration is incomplete.");
      return;
    }

    if (isS(c)) {
      return;
    }

    if (!isQuote(c)) {
      this.fail("value must be quoted.");
      this.q = SPACE;
    }
    else {
      this.q = c;
    }

    this.state = S_XML_DECL_VALUE;
  }

  // @ts-ignore
  private sXMLDeclValue(): void {
    const c = this.captureTo([this.q!, QUESTION]);

    // The question mark character is not valid inside any of the XML
    // declaration name/value pairs.
    if (c === QUESTION) {
      this.state = S_XML_DECL_ENDING;
      this.text = "";
      this.fail("XML declaration is incomplete.");
      return;
    }

    if (c === EOC) {
      return;
    }

    const value = this.text;
    this.text = "";
    switch (this.xmlDeclName) {
      case "version": {
        this.xmlDeclExpects = ["encoding", "standalone"];
        const version = value;
        this.xmlDecl.version = version;
        // This is the test specified by XML 1.0 but it is fine for XML 1.1.
        if (!/^1\.[0-9]+$/.test(version)) {
          this.fail("version number must match /^1\\.[0-9]+$/.");
        }
        // When forceXMLVersion is set, the XML declaration is ignored.
        else if (!(this.opt.forceXMLVersion as boolean)) {
          this.setXMLVersion(version);
        }
        break;
      }
      case "encoding":
        if (!/^[A-Za-z][A-Za-z0-9._-]*$/.test(value)) {
          this.fail("encoding value must match \
/^[A-Za-z0-9][A-Za-z0-9._-]*$/.");
        }
        this.xmlDeclExpects = ["standalone"];
        this.xmlDecl.encoding = value;
        break;
      case "standalone":
        if (value !== "yes" && value !== "no") {
          this.fail("standalone value must match \"yes\" or \"no\".");
        }
        this.xmlDeclExpects = [];
        this.xmlDecl.standalone = value;
        break;
      default:
        // We don't need to raise an error here since we've already raised one
        // when checking what name was expected.
    }
    this.xmlDeclName = "";
    this.state = S_XML_DECL_NAME_START;
    this.requiredSeparator = true;
  }

  // @ts-ignore
  private sPIEnding(): void {
    const c = this.getCodeNorm();
    if (c === GREATER) {
      if (this.piTarget.trim().toLowerCase() === "xml") {
        this.fail(
          "the XML declaration must appear at the start of the document.");
      }
      this.onprocessinginstruction({
        target: this.piTarget,
        body: this.text,
      });
      this.piTarget = this.text = "";
      this.state = S_TEXT;
    }
    else if (c === QUESTION) {
      // We ran into ?? as part of a processing instruction. We initially
      // took the first ? as a sign that the PI was ending, but it is
      // not. So we have to add it to the body but we take the new ? as a
      // sign that the PI is ending.
      this.text += "?";
    }
    else {
      this.text += `?${String.fromCodePoint(c)}`;
      this.state = S_PI_BODY;
    }
    this.xmlDeclPossible = false;
  }

  // @ts-ignore
  private sXMLDeclEnding(): void {
    const c = this.getCodeNorm();
    if (c === GREATER) {
      if (this.piTarget !== "xml") {
        this.fail("processing instructions are not allowed before root.");
      }
      else if (this.xmlDeclName !== "version" &&
               this.xmlDeclExpects.includes("version")) {
        this.fail("XML declaration must contain a version.");
      }
      this.xmlDeclName = "";
      this.requiredSeparator = false;
      this.piTarget = this.text = "";
      this.state = S_TEXT;
    }
    else {
      // We got here because the previous character was a ?, but the question
      // mark character is not valid inside any of the XML declaration
      // name/value pairs.
      this.fail("The character ? is disallowed anywhere in XML declarations.");
    }
    this.xmlDeclPossible = false;
  }

  // @ts-ignore
  private sOpenTag(): void {
    const c = this.captureNameChars();
    if (c === EOC) {
      return;
    }

    const tag: SaxesTagIncomplete = this.tag = {
      name: this.name,
      attributes: Object.create(null) as Record<string, string>,
    };
    this.name = "";

    if (this.xmlnsOpt) {
      tag.ns = Object.create(null);
    }

    this.onopentagstart(tag);
    this.sawRoot = true;
    if (!this.fragmentOpt && this.closedRoot) {
      this.fail("documents may contain only one root.");
    }

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

  // @ts-ignore
  private sOpenTagSlash(): void {
    if (this.getCode() === GREATER) {
      this.openSelfClosingTag();
    }
    else {
      this.fail("forward-slash in opening tag not followed by >.");
      this.state = S_ATTRIB;
    }
  }

  // @ts-ignore
  private sAttrib(): void {
    const c = this.skipSpaces();
    if (c === EOC) {
      return;
    }
    if (isNameStartChar(c)) {
      this.i = this.prevI;
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

  private pushAttribNS10(name: string, value: string): void {
    const { prefix, local } = this.qname(name);
    this.attribList.push({ name, prefix, local, value, uri: undefined });
    if (prefix === "xmlns") {
      const trimmed = value.trim();
      if (trimmed === "") {
        this.fail("invalid attempt to undefine prefix in XML 1.0");
      }
      this.tag!.ns![local] = trimmed;
      nsPairCheck(this, local, trimmed);
    }
    else if (name === "xmlns") {
      const trimmed = value.trim();
      this.tag!.ns![""] = trimmed;
      nsPairCheck(this, "", trimmed);
    }
  }

  pushAttribNS11(name: string, value: string): void {
    const { prefix, local } = this.qname(name);
    this.attribList.push({ name, prefix, local, value, uri: undefined });
    if (prefix === "xmlns") {
      const trimmed = value.trim();
      this.tag!.ns![local] = trimmed;
      nsPairCheck(this, local, trimmed);
    }
    else if (name === "xmlns") {
      const trimmed = value.trim();
      this.tag!.ns![""] = trimmed;
      nsPairCheck(this, "", trimmed);
    }
  }

  private pushAttribPlain(name: string, value: string): void {
    this.attribList.push({ name, value });
  }

  // @ts-ignore
  private sAttribName(): void {
    const c = this.captureNameChars();
    if (c === EQUAL) {
      this.state = S_ATTRIB_VALUE;
    }
    else if (isS(c)) {
      this.state = S_ATTRIB_NAME_SAW_WHITE;
    }
    else if (c === GREATER) {
      this.fail("attribute without value.");
      this.pushAttrib(this.name, this.name);
      this.name = this.text = "";
      this.openTag();
    }
    else if (c !== EOC) {
      this.fail("disallowed character in attribute name.");
    }
  }

  // @ts-ignore
  private sAttribNameSawWhite(): void {
    const c = this.skipSpaces();
    switch (c) {
      case EOC:
        return;
      case EQUAL:
        this.state = S_ATTRIB_VALUE;
        break;
      default:
        this.fail("attribute without value.");
        // Should we do this???
        // this.tag.attributes[this.name] = "";
        this.text = "";
        this.name = "";
        if (c === GREATER) {
          this.openTag();
        }
        else if (isNameStartChar(c)) {
          this.i = this.prevI;
          this.state = S_ATTRIB_NAME;
        }
        else {
          this.fail("disallowed character in attribute name.");
          this.state = S_ATTRIB;
        }
    }
  }

  // @ts-ignore
  private sAttribValue(): void {
    const c = this.getCodeNorm();
    if (isQuote(c)) {
      this.q = c;
      this.state = S_ATTRIB_VALUE_QUOTED;
    }
    else if (!isS(c)) {
      this.fail("unquoted attribute value.");
      this.state = S_ATTRIB_VALUE_UNQUOTED;
      this.i = this.prevI;
    }
  }

  // @ts-ignore
  private sAttribValueQuoted(): void {
    // We deliberately do not use captureTo here. The specialized code we use
    // here is faster than using captureTo.
    const { q } = this;
    let { i: start } = this;
    const { chunk } = this;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const code = this.getCode();
      switch (code) {
        case q:
          this.pushAttrib(this.name,
                          this.text + chunk.slice(start, this.prevI));
          this.name = this.text = "";
          this.q = null;
          this.state = S_ATTRIB_VALUE_CLOSED;
          return;
        case AMP:
          this.text += chunk.slice(start, this.prevI);
          this.state = S_ENTITY;
          this.entityReturnState = S_ATTRIB_VALUE_QUOTED;
          return;
        case NL:
        case NL_LIKE:
        case TAB:
          this.text += `${chunk.slice(start, this.prevI)} `;
          start = this.i;
          break;
        case LESS:
          this.text += chunk.slice(start, this.prevI);
          this.fail("disallowed character.");
          return;
        case EOC:
          this.text += chunk.slice(start);
          return;
        default:
      }
    }
  }

  // @ts-ignore
  private sAttribValueClosed(): void {
    const c = this.getCodeNorm();
    if (isS(c)) {
      this.state = S_ATTRIB;
    }
    else if (c === GREATER) {
      this.openTag();
    }
    else if (c === FORWARD_SLASH) {
      this.state = S_OPEN_TAG_SLASH;
    }
    else if (isNameStartChar(c)) {
      this.fail("no whitespace between attributes.");
      this.i = this.prevI;
      this.state = S_ATTRIB_NAME;
    }
    else {
      this.fail("disallowed character in attribute name.");
    }
  }

  // @ts-ignore
  private sAttribValueUnquoted(): void {
    // We don't do anything regarding EOL or space handling for unquoted
    // attributes. We already have failed by the time we get here, and the
    // contract that saxes upholds states that upon failure, it is not safe to
    // rely on the data passed to event handlers (other than
    // ``onerror``). Passing "bad" data is not a problem.
    const c = this.captureTo(ATTRIB_VALUE_UNQUOTED_TERMINATOR);
    switch (c) {
      case AMP:
        this.state = S_ENTITY;
        this.entityReturnState = S_ATTRIB_VALUE_UNQUOTED;
        break;
      case LESS:
        this.fail("disallowed character.");
        break;
      case EOC:
        break;
      default:
        if (this.text.includes("]]>")) {
          this.fail("the string \"]]>\" is disallowed in char data.");
        }
        this.pushAttrib(this.name, this.text);
        this.name = this.text = "";
        if (c === GREATER) {
          this.openTag();
        }
        else {
          this.state = S_ATTRIB;
        }
    }
  }

  // @ts-ignore
  private sCloseTag(): void {
    const c = this.captureNameChars();
    if (c === GREATER) {
      this.closeTag();
    }
    else if (isS(c)) {
      this.state = S_CLOSE_TAG_SAW_WHITE;
    }
    else if (c !== EOC) {
      this.fail("disallowed character in closing tag.");
    }
  }

  // @ts-ignore
  private sCloseTagSawWhite(): void {
    switch (this.skipSpaces()) {
      case GREATER:
        this.closeTag();
        break;
      case EOC:
        break;
      default:
        this.fail("disallowed character in closing tag.");
    }
  }

  // @ts-ignore
  private sEntity(): void {
    // This is essentially a specialized version of captureToChar(SEMICOLON...)
    let { i: start } = this;
    const { chunk } = this;
    // eslint-disable-next-line no-labels, no-restricted-syntax
    loop:
    // eslint-disable-next-line no-constant-condition
    while (true) {
      switch (this.getCode()) {
        case NL_LIKE:
          this.entity += `${chunk.slice(start, this.prevI)}\n`;
          start = this.i;
          break;
        case SEMICOLON:
          this.entity += chunk.slice(start, this.prevI);
          this.state = this.entityReturnState!;
          if (this.entity === "") {
            this.fail("empty entity name.");
            this.text += "&;";
            return;
          }
          this.text += this.parseEntity(this.entity);
          this.entity = "";
          // eslint-disable-next-line no-labels
          break loop;
        case EOC:
          this.entity += chunk.slice(start);
          // eslint-disable-next-line no-labels
          break loop;
        default:
      }
    }
  }

  // END OF STATE HANDLERS

  /**
   * End parsing. This performs final well-formedness checks and resets the
   * parser to a clean state.
   *
   * @returns this
   */
  end(): this {
    if (!this.sawRoot) {
      this.fail("document must contain a root element.");
    }
    const { tags } = this;
    while (tags.length > 0) {
      const tag = tags.pop()!;
      this.fail(`unclosed tag: ${tag.name}`);
    }
    if ((this.state !== S_BEGIN_WHITESPACE) &&
        (this.state !== S_TEXT)) {
      this.fail("unexpected end.");
    }
    const { text } = this;
    if (text.length !== 0) {
      this.ontext(text);
      this.text = "";
    }
    this._closed = true;
    this.onend();
    this._init();
    return this;
  }

  /**
   * Resolve a namespace prefix.
   *
   * @param prefix The prefix to resolve.
   *
   * @returns The namespace URI or ``undefined`` if the prefix is not defined.
   */
  resolve(prefix: string): string | undefined {
    let uri = this.tag!.ns![prefix];
    if (uri !== undefined) {
      return uri;
    }

    const { tags } = this;
    for (let index = tags.length - 1; index >= 0; index--) {
      uri = tags[index]!.ns![prefix];
      if (uri !== undefined) {
        return uri;
      }
    }

    uri = this.ns[prefix];
    if (uri !== undefined) {
      return uri;
    }

    return this.opt.resolvePrefix?.(prefix);
  }

  /**
   * Parse a qname into its prefix and local name parts.
   *
   * @param name The name to parse
   *
   * @returns
   */
  private qname(name: string): { prefix: string; local: string } {
    // This is faster than using name.split(":").
    const colon = name.indexOf(":");
    if (colon === -1) {
      return { prefix: "", local: name };
    }

    const local = name.slice(colon + 1);
    const prefix = name.slice(0, colon);
    if (prefix === "" || local === "" || local.includes(":")) {
      this.fail(`malformed name: ${name}.`);
    }

    return { prefix, local };
  }

  private processAttribsNS(): void {
    const { attribList } = this;
    const tag = this.tag!;

    {
      // add namespace info to tag
      const { prefix, local } = this.qname(tag.name);
      tag.prefix = prefix;
      tag.local = local;
      const uri = tag.uri = this.resolve(prefix) ?? "";

      if (prefix !== "") {
        if (prefix === "xmlns") {
          this.fail("tags may not have \"xmlns\" as prefix.");
        }

        if (uri === "") {
          this.fail(`unbound namespace prefix: ${JSON.stringify(prefix)}.`);
          tag.uri = prefix;
        }
      }
    }

    if (attribList.length === 0) {
      return;
    }

    const { attributes } = tag;
    const seen = new Set();
    // Note: do not apply default ns to attributes:
    //   http://www.w3.org/TR/REC-xml-names/#defaulting
    for (const attr of attribList as SaxesAttributeNS[]) {
      const { name, prefix, local } = attr;
      let uri;
      let eqname;
      if (prefix === "") {
        uri = name === "xmlns" ? XMLNS_NAMESPACE : "";
        eqname = name;
      }
      else {
        uri = this.resolve(prefix);
        // if there's any attributes with an undefined namespace,
        // then fail on them now.
        if (uri === undefined) {
          this.fail(`unbound namespace prefix: ${JSON.stringify(prefix)}.`);
          uri = prefix;
        }
        eqname = `{${uri}}${local}`;
      }

      if (seen.has(eqname)) {
        this.fail(`duplicate attribute: ${eqname}.`);
      }
      seen.add(eqname);

      attr.uri = uri;
      attributes[name] = attr;
    }

    this.attribList = [];
  }

  private processAttribsPlain(): void {
    const { attribList } = this;
    // eslint-disable-next-line prefer-destructuring
    const attributes = this.tag!.attributes;
    for (const { name, value } of attribList) {
      if (attributes[name] !== undefined) {
        this.fail(`duplicate attribute: ${name}.`);
      }
      attributes[name] = value;
    }

    this.attribList = [];
  }

  /**
   * Handle a complete open tag. This parser code calls this once it has seen
   * the whole tag. This method checks for well-formeness and then emits
   * ``onopentag``.
   */
  private openTag(): void {
    this.processAttribs();

    const { tags } = this;
    const tag = this.tag as SaxesTag;
    tag.isSelfClosing = false;

    // There cannot be any pending text here due to the onopentagstart that was
    // necessarily emitted before we get here. So we do not check text.
    this.onopentag(tag);
    tags.push(tag);
    this.state = S_TEXT;
    this.name = "";
  }

  /**
   * Handle a complete self-closing tag. This parser code calls this once it has
   * seen the whole tag. This method checks for well-formeness and then emits
   * ``onopentag`` and ``onclosetag``.
   */
  private openSelfClosingTag(): void {
    this.processAttribs();

    const { tags } = this;
    const tag = this.tag as SaxesTag;
    tag.isSelfClosing = true;

    // There cannot be any pending text here due to the onopentagstart that was
    // necessarily emitted before we get here. So we do not check text.
    this.onopentag(tag);
    this.onclosetag(tag);
    const top = this.tag = tags[tags.length - 1] ?? null;
    if (top === null) {
      this.closedRoot = true;
    }
    this.state = S_TEXT;
    this.name = "";
  }

  /**
   * Handle a complete close tag. This parser code calls this once it has seen
   * the whole tag. This method checks for well-formeness and then emits
   * ``onclosetag``.
   */
  private closeTag(): void {
    const { tags, name } = this;

    // Our state after this will be S_TEXT, no matter what, and we can clear
    // tagName now.
    this.state = S_TEXT;
    this.name = "";

    if (name === "") {
      this.fail("weird empty close tag.");
      this.text += "</>";
      return;
    }

    let l = tags.length;
    while (l-- > 0) {
      const tag = this.tag = tags.pop() as SaxesTag;
      this.onclosetag(tag);
      if (tag.name === name) {
        break;
      }
      this.fail("unexpected close tag.");
    }

    if (l === 0) {
      this.closedRoot = true;
    }
    else if (l < 0) {
      this.fail(`unmatched closing tag: ${name}.`);
      this.text += `</${name}>`;
    }
  }

  /**
   * Resolves an entity. Makes any necessary well-formedness checks.
   *
   * @param entity The entity to resolve.
   *
   * @returns The parsed entity.
   */
  private parseEntity(entity: string): string {
    // startsWith would be significantly slower for this test.
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
    if (entity[0] !== "#") {
      const defined = this.ENTITIES[entity];
      if (defined !== undefined) {
        return defined;
      }

      this.fail(this.isName(entity) ? "undefined entity." :
        "disallowed character in entity name.");
      return `&${entity};`;
    }

    let num = NaN;
    if (entity[1] === "x" && /^#x[0-9a-f]+$/i.test(entity)) {
      num = parseInt(entity.slice(2), 16);
    }
    else if (/^#[0-9]+$/.test(entity)) {
      num = parseInt(entity.slice(1), 10);
    }

    // The character reference is required to match the CHAR production.
    if (!this.isChar(num)) {
      this.fail("malformed character entity.");
      return `&${entity};`;
    }

    return String.fromCodePoint(num);
  }
}

/**
 * This is the interface of a parser that has been created with ``xmlns: true``.
 */
export interface SaxesParserNS extends SaxesParserImpl {
  onopentagstart(tag: SaxesStartTagNS): void;
  onopentag(tag: SaxesTagNS): void;
  onclosetag(tag: SaxesTagNS): void;
}

/**
 * This is the interface of a parser that has been created with ``xmlns:
 * false``.
 */
export interface SaxesParserPlain extends SaxesParserImpl {
  onopentagstart(tag: SaxesStartTagPlain): void;
  onopentag(tag: SaxesTagPlain): void;
  onclosetag(tag: SaxesTagPlain): void;
}

export interface SaxesParserConstructor {
  new (opt: SaxesOptions & { xmlns: true }): SaxesParserNS;
  new (opt: SaxesOptions & { xmlns?: false | undefined }): SaxesParserPlain;
}

export const SaxesParser: SaxesParserConstructor = SaxesParserImpl;
export type SaxesParser = SaxesParserImpl;
