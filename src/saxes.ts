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

const S_BEGIN_WHITESPACE = 0; // leading whitespace
const S_DOCTYPE = 1; // <!DOCTYPE
const S_DOCTYPE_QUOTE = 2; // <!DOCTYPE "//blah
const S_DTD = 3; // <!DOCTYPE "//blah" [ ...
const S_DTD_QUOTED = 4; // <!DOCTYPE "//blah" [ "foo
const S_DTD_OPEN_WAKA = 5;
const S_DTD_OPEN_WAKA_BANG = 6;
const S_DTD_COMMENT = 7; // <!--
const S_DTD_COMMENT_ENDING = 8; // <!-- blah -
const S_DTD_COMMENT_ENDED = 9; // <!-- blah --
const S_DTD_PI = 10; // <?
const S_DTD_PI_ENDING = 11; // <?hi "there" ?
const S_TEXT = 12; // general stuff
const S_ENTITY = 13; // &amp and such
const S_OPEN_WAKA = 14; // <
const S_OPEN_WAKA_BANG = 15; // <!...
const S_COMMENT = 16; // <!--
const S_COMMENT_ENDING = 17; // <!-- blah -
const S_COMMENT_ENDED = 18; // <!-- blah --
const S_CDATA = 19; // <![CDATA[ something
const S_CDATA_ENDING = 20; // ]
const S_CDATA_ENDING_2 = 21; // ]]
const S_PI_FIRST_CHAR = 22; // <?hi, first char
const S_PI_REST = 23; // <?hi, rest of the name
const S_PI_BODY = 24; // <?hi there
const S_PI_ENDING = 25; // <?hi "there" ?
const S_XML_DECL_NAME_START = 26; // <?xml
const S_XML_DECL_NAME = 27; // <?xml foo
const S_XML_DECL_EQ = 28; // <?xml foo=
const S_XML_DECL_VALUE_START = 29; // <?xml foo=
const S_XML_DECL_VALUE = 30; // <?xml foo="bar"
const S_XML_DECL_ENDING = 31; // <?xml ... ?
const S_OPEN_TAG = 32; // <strong
const S_OPEN_TAG_SLASH = 33; // <strong /
const S_ATTRIB = 34; // <a
const S_ATTRIB_NAME = 35; // <a foo
const S_ATTRIB_NAME_SAW_WHITE = 36; // <a foo _
const S_ATTRIB_VALUE = 37; // <a foo=
const S_ATTRIB_VALUE_QUOTED = 38; // <a foo="bar
const S_ATTRIB_VALUE_CLOSED = 39; // <a foo="bar"
const S_ATTRIB_VALUE_UNQUOTED = 40; // <a foo=bar
const S_CLOSE_TAG = 41; // </a
const S_CLOSE_TAG_SAW_WHITE = 42; // </a   >


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
  // @ts-ignore
  private readonly nameStartCheck: (c: number) => boolean;
  private readonly nameCheck: (c: number) => boolean;
  private readonly isName: (name: string) => boolean;
  private readonly ns!: Record<string, string>;

  // @ts-ignore
  private openWakaBang!: string;
  private text!: string;
  private name!: string;
  // @ts-ignore
  private piTarget!: string;
  // @ts-ignore
  private entity!: string;
  // @ts-ignore
  private xmlDeclName!: string;
  // @ts-ignore
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
  private state!: number;
  private reportedTextBeforeRoot!: boolean;
  private reportedTextAfterRoot!: boolean;
  private closedRoot!: boolean;
  private sawRoot!: boolean;
  // @ts-ignore
  private xmlDeclPossible!: boolean;
  // @ts-ignore
  private xmlDeclExpects!: string[];
  // @ts-ignore
  private requiredSeparator!: boolean;
  // @ts-ignore
  private entityReturnState?: number;
  private processAttribs!: (this: this) => void;
  private positionAtNewLine!: number;
  // @ts-ignore
  private doctype!: boolean;
  private getCode!: () => number;
  private isChar!: (c: number) => boolean;
  // @ts-ignore
  private pushAttrib!: (name: string, value: string) => void;
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
      // eslint-disable-next-line max-len
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-use-before-define, no-use-before-define
      stateTable[this.state](this as any);
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
  // @ts-ignore
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
  // @ts-ignore
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
  // @ts-ignore
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
  // @ts-ignore
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
  // @ts-ignore
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

  // @ts-ignore
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

  // @ts-ignore
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
  // @ts-ignore
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
  // @ts-ignore
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
  // @ts-ignore
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
  // @ts-ignore
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

//
// State table
//

//
// Splitting off the state table into an array like this yields significant
// performance improvements over the previous implementation in which the state
// functions were methods on SaxesParserImpl (we did ``this[state]()``).
//
// For the record:
//
// * A huge switch is hard for JavaScript engines to optimize. sax-js used a
//    huge switch. saxes got faster than sax-js after getting away from that.
//
// * An object with mixed number/string indices is **slow** so just merging the
//   state table with SaxesParserImpl would not work.
//
// Unfortunately TypeScript has no notion of "friend functiod/class" so in order
// for the state engine to be able to just access the internals, we need an
// interface that exposes the internals of SaxesParserImpl.
//
// This arrangement also explains the @ts-ignore we need on some fields of
// SaxesParserImpl. It looks to the TS compiler like the fields are not used
// when in fact they are used by the state code.
//

type StateTableThis =
  // This takes care of all the public interface.
  { [k in keyof SaxesParserImpl]: SaxesParserImpl[k] } & {
    fragmentOpt: SaxesParserImpl["fragmentOpt"];
    xmlnsOpt: SaxesParserImpl["xmlnsOpt"];
    nameStartCheck: SaxesParserImpl["nameStartCheck"];
    openWakaBang: SaxesParserImpl["openWakaBang"];
    text: SaxesParserImpl["text"];
    name: SaxesParserImpl["name"];
    piTarget: SaxesParserImpl["piTarget"];
    entity: SaxesParserImpl["entity"];
    xmlDeclName: SaxesParserImpl["xmlDeclName"];
    q: SaxesParserImpl["q"];
    tags: SaxesParserImpl["tags"];
    tag: SaxesParserImpl["tag"];
    chunk: SaxesParserImpl["chunk"];
    i: SaxesParserImpl["i"];
    prevI: SaxesParserImpl["prevI"];
    state: SaxesParserImpl["state"];
    reportedTextBeforeRoot: SaxesParserImpl["reportedTextBeforeRoot"];
    reportedTextAfterRoot: SaxesParserImpl["reportedTextAfterRoot"];
    closedRoot: SaxesParserImpl["closedRoot"];
    sawRoot: SaxesParserImpl["sawRoot"];
    xmlDeclPossible: SaxesParserImpl["xmlDeclPossible"];
    xmlDeclExpects: SaxesParserImpl["xmlDeclExpects"];
    requiredSeparator: SaxesParserImpl["requiredSeparator"];
    entityReturnState: SaxesParserImpl["entityReturnState"];
    doctype: SaxesParserImpl["doctype"];

    getCode: SaxesParserImpl["getCode"];
    pushAttrib: SaxesParserImpl["pushAttrib"];

    getCodeNorm: SaxesParserImpl["getCodeNorm"];
    captureTo: SaxesParserImpl["captureTo"];
    captureToChar: SaxesParserImpl["captureToChar"];
    captureNameChars: SaxesParserImpl["captureNameChars"];
    captureWhileNameCheck: SaxesParserImpl["captureWhileNameCheck"];
    skipSpaces: SaxesParserImpl["skipSpaces"];
    setXMLVersion: SaxesParserImpl["setXMLVersion"];

    handleTextInRoot: SaxesParserImpl["handleTextInRoot"];
    handleTextOutsideRoot: SaxesParserImpl["handleTextOutsideRoot"];
    openTag: SaxesParserImpl["openTag"];
    openSelfClosingTag: SaxesParserImpl["openSelfClosingTag"];
    closeTag: SaxesParserImpl["closeTag"];
    parseEntity: SaxesParserImpl["parseEntity"];
  };

const stateTable: ((parser: StateTableThis) => void)[] = [
  function sBeginWhitespace(parser: StateTableThis): void {
    // We are essentially peeking at the first character of the chunk. Since
    // S_BEGIN_WHITESPACE can be in effect only when we start working on the
    // first chunk, the index at which we must look is necessarily 0. Note also
    // that the following test does not depend on decoding surrogates.

    // If the initial character is 0xFEFF, ignore it.
    if (parser.chunk.charCodeAt(0) === 0xFEFF) {
      parser.i++;
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
      c = parser.getCodeNorm();
      if (c === EOC || !isS(c)) {
        break;
      }

      sawSpace = true;
    }

    if (sawSpace) {
      parser.xmlDeclPossible = false;
    }

    switch (c) {
      case LESS:
        parser.state = S_OPEN_WAKA;
        // We could naively call closeText but in this state, it is not normal
        // to have text be filled with any data.
        if (parser.text.length !== 0) {
          throw new Error("no-empty text at start");
        }
        break;
      case EOC:
        break;
      default:
        // have to process this as a text node.
        // weird, but happens.
        if (!parser.reportedTextBeforeRoot) {
          parser.fail("text data outside of root node.");
          parser.reportedTextBeforeRoot = true;
        }
        parser.i = parser.prevI;
        parser.state = S_TEXT;
        parser.xmlDeclPossible = false;
    }
  },

  function sDoctype(parser: StateTableThis): void {
    const c = parser.captureTo(DOCTYPE_TERMINATOR);
    switch (c) {
      case GREATER:
        parser.ondoctype(parser.text);
        parser.text = "";
        parser.state = S_TEXT;
        parser.doctype = true; // just remember that we saw it.
        break;
      case EOC:
        break;
      default:
        parser.text += String.fromCodePoint(c);
        if (c === OPEN_BRACKET) {
          parser.state = S_DTD;
        }
        else if (isQuote(c)) {
          parser.state = S_DOCTYPE_QUOTE;
          parser.q = c;
        }
    }
  },

  function sDoctypeQuote(parser: StateTableThis): void {
    const q = parser.q!;
    if (parser.captureToChar(q)) {
      parser.text += String.fromCodePoint(q);
      parser.q = null;
      parser.state = S_DOCTYPE;
    }
  },

  function sDTD(parser: StateTableThis): void {
    const c = parser.captureTo(DTD_TERMINATOR);
    if (c === EOC) {
      return;
    }

    parser.text += String.fromCodePoint(c);
    if (c === CLOSE_BRACKET) {
      parser.state = S_DOCTYPE;
    }
    else if (c === LESS) {
      parser.state = S_DTD_OPEN_WAKA;
    }
    else if (isQuote(c)) {
      parser.state = S_DTD_QUOTED;
      parser.q = c;
    }
  },

  function sDTDQuoted(parser: StateTableThis): void {
    const q = parser.q!;
    if (parser.captureToChar(q)) {
      parser.text += String.fromCodePoint(q);
      parser.state = S_DTD;
      parser.q = null;
    }
  },

  function sDTDOpenWaka(parser: StateTableThis): void {
    const c = parser.getCodeNorm();
    parser.text += String.fromCodePoint(c);
    switch (c) {
      case BANG:
        parser.state = S_DTD_OPEN_WAKA_BANG;
        parser.openWakaBang = "";
        break;
      case QUESTION:
        parser.state = S_DTD_PI;
        break;
      default:
        parser.state = S_DTD;
    }
  },

  function sDTDOpenWakaBang(parser: StateTableThis): void {
    const char = String.fromCodePoint(parser.getCodeNorm());
    const owb = parser.openWakaBang += char;
    parser.text += char;
    if (owb !== "-") {
      parser.state = owb === "--" ? S_DTD_COMMENT : S_DTD;
      parser.openWakaBang = "";
    }
  },

  function sDTDComment(parser: StateTableThis): void {
    if (parser.captureToChar(MINUS)) {
      parser.text += "-";
      parser.state = S_DTD_COMMENT_ENDING;
    }
  },

  function sDTDCommentEnding(parser: StateTableThis): void {
    const c = parser.getCodeNorm();
    parser.text += String.fromCodePoint(c);
    parser.state = c === MINUS ? S_DTD_COMMENT_ENDED : S_DTD_COMMENT;
  },

  function sDTDCommentEnded(parser: StateTableThis): void {
    const c = parser.getCodeNorm();
    parser.text += String.fromCodePoint(c);
    if (c === GREATER) {
      parser.state = S_DTD;
    }
    else {
      parser.fail("malformed comment.");
      // <!-- blah -- bloo --> will be recorded as
      // a comment of " blah -- bloo "
      parser.state = S_DTD_COMMENT;
    }
  },

  function sDTDPI(parser: StateTableThis): void {
    if (parser.captureToChar(QUESTION)) {
      parser.text += "?";
      parser.state = S_DTD_PI_ENDING;
    }
  },

  function sDTDPIEnding(parser: StateTableThis): void {
    const c = parser.getCodeNorm();
    parser.text += String.fromCodePoint(c);
    if (c === GREATER) {
      parser.state = S_DTD;
    }
  },

  function sText(parser: StateTableThis): void {
    //
    // We did try a version of saxes where the S_TEXT state was split in two
    // states: one for text inside the root element, and one for text
    // outside. This was avoiding having to test parser.tags.length to decide
    // what implementation to actually use.
    //
    // Peformance testing on gigabyte-size files did not show any advantage to
    // using the two states solution instead of the current one. Conversely, it
    // made the code a bit more complicated elsewhere. For instance, a comment
    // can appear before the root element so when a comment ended it was
    // necessary to determine whether to return to the S_TEXT state or to the
    // new text-outside-root state.
    //
    if (parser.tags.length !== 0) {
      parser.handleTextInRoot();
    }
    else {
      parser.handleTextOutsideRoot();
    }
  },

  function sEntity(parser: StateTableThis): void {
    // This is essentially a specialized version of captureToChar(SEMICOLON...)
    let { i: start } = parser;
    const { chunk } = parser;
    // eslint-disable-next-line no-labels, no-restricted-syntax
    loop:
    // eslint-disable-next-line no-constant-condition
    while (true) {
      switch (parser.getCode()) {
        case NL_LIKE:
          parser.entity += `${chunk.slice(start, parser.prevI)}\n`;
          start = parser.i;
          break;
        case SEMICOLON:
          parser.entity += chunk.slice(start, parser.prevI);
          parser.state = parser.entityReturnState!;
          if (parser.entity === "") {
            parser.fail("empty entity name.");
            parser.text += "&;";
            return;
          }
          parser.text += parser.parseEntity(parser.entity);
          parser.entity = "";
          // eslint-disable-next-line no-labels
          break loop;
        case EOC:
          parser.entity += chunk.slice(start);
          // eslint-disable-next-line no-labels
          break loop;
        default:
      }
    }
  },

  function sOpenWaka(parser: StateTableThis): void {
    // Reminder: a state handler is called with at least one character
    // available in the current chunk. So the first call to get code inside of
    // a state handler cannot return ``EOC``. That's why we don't test
    // for it.
    const c = parser.getCode();
    // either a /, ?, !, or text is coming next.
    if (isNameStartChar(c)) {
      parser.state = S_OPEN_TAG;
      parser.i = parser.prevI;
      parser.xmlDeclPossible = false;
    }
    else {
      switch (c) {
        case FORWARD_SLASH:
          parser.state = S_CLOSE_TAG;
          parser.xmlDeclPossible = false;
          break;
        case BANG:
          parser.state = S_OPEN_WAKA_BANG;
          parser.openWakaBang = "";
          parser.xmlDeclPossible = false;
          break;
        case QUESTION:
          parser.state = S_PI_FIRST_CHAR;
          break;
        default:
          parser.fail("disallowed character in tag name");
          parser.state = S_TEXT;
          parser.xmlDeclPossible = false;
      }
    }
  },

  function sOpenWakaBang(parser: StateTableThis): void {
    parser.openWakaBang += String.fromCodePoint(parser.getCodeNorm());
    switch (parser.openWakaBang) {
      case "[CDATA[":
        if (!parser.sawRoot && !parser.reportedTextBeforeRoot) {
          parser.fail("text data outside of root node.");
          parser.reportedTextBeforeRoot = true;
        }

        if (parser.closedRoot && !parser.reportedTextAfterRoot) {
          parser.fail("text data outside of root node.");
          parser.reportedTextAfterRoot = true;
        }
        parser.state = S_CDATA;
        parser.openWakaBang = "";
        break;
      case "--":
        parser.state = S_COMMENT;
        parser.openWakaBang = "";
        break;
      case "DOCTYPE":
        parser.state = S_DOCTYPE;
        if (parser.doctype || parser.sawRoot) {
          parser.fail("inappropriately located doctype declaration.");
        }
        parser.openWakaBang = "";
        break;
      default:
        // 7 happens to be the maximum length of the string that can possibly
        // match one of the cases above.
        if (parser.openWakaBang.length >= 7) {
          parser.fail("incorrect syntax.");
        }
    }
  },

  function sComment(parser: StateTableThis): void {
    if (parser.captureToChar(MINUS)) {
      parser.state = S_COMMENT_ENDING;
    }
  },

  function sCommentEnding(parser: StateTableThis): void {
    const c = parser.getCodeNorm();
    if (c === MINUS) {
      parser.state = S_COMMENT_ENDED;
      parser.oncomment(parser.text);
      parser.text = "";
    }
    else {
      parser.text += `-${String.fromCodePoint(c)}`;
      parser.state = S_COMMENT;
    }
  },

  function sCommentEnded(parser: StateTableThis): void {
    const c = parser.getCodeNorm();
    if (c !== GREATER) {
      parser.fail("malformed comment.");
      // <!-- blah -- bloo --> will be recorded as
      // a comment of " blah -- bloo "
      parser.text += `--${String.fromCodePoint(c)}`;
      parser.state = S_COMMENT;
    }
    else {
      parser.state = S_TEXT;
    }
  },

  function sCData(parser: StateTableThis): void {
    if (parser.captureToChar(CLOSE_BRACKET)) {
      parser.state = S_CDATA_ENDING;
    }
  },

  function sCDataEnding(parser: StateTableThis): void {
    const c = parser.getCodeNorm();
    if (c === CLOSE_BRACKET) {
      parser.state = S_CDATA_ENDING_2;
    }
    else {
      parser.text += `]${String.fromCodePoint(c)}`;
      parser.state = S_CDATA;
    }
  },

  function sCDataEnding2(parser: StateTableThis): void {
    const c = parser.getCodeNorm();
    switch (c) {
      case GREATER:
        parser.oncdata(parser.text);
        parser.text = "";
        parser.state = S_TEXT;
        break;
      case CLOSE_BRACKET:
        parser.text += "]";
        break;
      default:
        parser.text += `]]${String.fromCodePoint(c)}`;
        parser.state = S_CDATA;
    }
  },

  function sPIFirstChar(parser: StateTableThis): void {
    const c = parser.getCodeNorm();
    if (parser.nameStartCheck(c)) {
      parser.piTarget += String.fromCodePoint(c);
      parser.state = S_PI_REST;
    }
    else if (c === QUESTION || isS(c)) {
      parser.fail("processing instruction without a target.");
      parser.state = c === QUESTION ? S_PI_ENDING : S_PI_BODY;
    }
    else {
      parser.fail("disallowed character in processing instruction name.");
      parser.piTarget += String.fromCodePoint(c);
      parser.state = S_PI_REST;
    }
  },

  function sPIRest(parser: StateTableThis): void {
    const c = parser.captureWhileNameCheck("piTarget");
    if (c === QUESTION || isS(c)) {
      if (parser.piTarget === "xml") {
        if (!parser.xmlDeclPossible) {
          parser.fail(
            "an XML declaration must be at the start of the document.");
        }

        parser.state =
          c === QUESTION ? S_XML_DECL_ENDING : S_XML_DECL_NAME_START;
      }
      else {
        parser.state = c === QUESTION ? S_PI_ENDING : S_PI_BODY;
      }
    }
    else if (c !== EOC) {
      parser.fail("disallowed character in processing instruction name.");
      parser.piTarget += String.fromCodePoint(c);
    }
  },

  function sPIBody(parser: StateTableThis): void {
    if (parser.text.length === 0) {
      const c = parser.getCodeNorm();
      if (c === QUESTION) {
        parser.state = S_PI_ENDING;
      }
      else if (!isS(c)) {
        parser.text = String.fromCodePoint(c);
      }
    }
    // The question mark character is not valid inside any of the XML
    // declaration name/value pairs.
    else if (parser.captureToChar(QUESTION)) {
      parser.state = S_PI_ENDING;
    }
  },

  function sPIEnding(parser: StateTableThis): void {
    const c = parser.getCodeNorm();
    if (c === GREATER) {
      if (parser.piTarget.trim().toLowerCase() === "xml") {
        parser.fail(
          "the XML declaration must appear at the start of the document.");
      }
      parser.onprocessinginstruction({
        target: parser.piTarget,
        body: parser.text,
      });
      parser.piTarget = parser.text = "";
      parser.state = S_TEXT;
    }
    else if (c === QUESTION) {
      // We ran into ?? as part of a processing instruction. We initially
      // took the first ? as a sign that the PI was ending, but it is
      // not. So we have to add it to the body but we take the new ? as a
      // sign that the PI is ending.
      parser.text += "?";
    }
    else {
      parser.text += `?${String.fromCodePoint(c)}`;
      parser.state = S_PI_BODY;
    }
    parser.xmlDeclPossible = false;
  },

  function sXMLDeclNameStart(parser: StateTableThis): void {
    let c = parser.getCodeNorm();
    if (isS(c)) {
      c = parser.skipSpaces();
    }
    else if (parser.requiredSeparator && c !== QUESTION) {
      parser.fail("whitespace required.");
    }
    parser.requiredSeparator = false;

    // The question mark character is not valid inside any of the XML
    // declaration name/value pairs.
    if (c === QUESTION) {
      // This is the only state from which it is valid to go to
      // S_XML_DECL_ENDING.
      parser.state = S_XML_DECL_ENDING;
      return;
    }

    if (c !== EOC) {
      parser.state = S_XML_DECL_NAME;
      parser.xmlDeclName = String.fromCodePoint(c);
    }
  },

  function sXMLDeclName(parser: StateTableThis): void {
    const c = parser.captureTo(XML_DECL_NAME_TERMINATOR);
    // The question mark character is not valid inside any of the XML
    // declaration name/value pairs.
    if (c === QUESTION) {
      parser.state = S_XML_DECL_ENDING;
      parser.xmlDeclName += parser.text;
      parser.text = "";
      parser.fail("XML declaration is incomplete.");
      return;
    }

    if (!(isS(c) || c === EQUAL)) {
      return;
    }

    parser.xmlDeclName += parser.text;
    parser.text = "";
    if (!parser.xmlDeclExpects.includes(parser.xmlDeclName)) {
      switch (parser.xmlDeclName.length) {
        case 0:
          parser.fail("did not expect any more name/value pairs.");
          break;
        case 1:
          parser.fail(`expected the name ${parser.xmlDeclExpects[0]}.`);
          break;
        default:
          parser.fail(`expected one of ${parser.xmlDeclExpects.join(", ")}`);
      }
    }

    parser.state = c === EQUAL ? S_XML_DECL_VALUE_START : S_XML_DECL_EQ;
  },

  function sXMLDeclEq(parser: StateTableThis): void {
    const c = parser.getCodeNorm();
    // The question mark character is not valid inside any of the XML
    // declaration name/value pairs.
    if (c === QUESTION) {
      parser.state = S_XML_DECL_ENDING;
      parser.fail("XML declaration is incomplete.");
      return;
    }

    if (isS(c)) {
      return;
    }

    if (c !== EQUAL) {
      parser.fail("value required.");
    }

    parser.state = S_XML_DECL_VALUE_START;
  },

  function sXMLDeclValueStart(parser: StateTableThis): void {
    const c = parser.getCodeNorm();
    // The question mark character is not valid inside any of the XML
    // declaration name/value pairs.
    if (c === QUESTION) {
      parser.state = S_XML_DECL_ENDING;
      parser.fail("XML declaration is incomplete.");
      return;
    }

    if (isS(c)) {
      return;
    }

    if (!isQuote(c)) {
      parser.fail("value must be quoted.");
      parser.q = SPACE;
    }
    else {
      parser.q = c;
    }

    parser.state = S_XML_DECL_VALUE;
  },

  function sXMLDeclValue(parser: StateTableThis): void {
    const c = parser.captureTo([parser.q!, QUESTION]);

    // The question mark character is not valid inside any of the XML
    // declaration name/value pairs.
    if (c === QUESTION) {
      parser.state = S_XML_DECL_ENDING;
      parser.text = "";
      parser.fail("XML declaration is incomplete.");
      return;
    }

    if (c === EOC) {
      return;
    }

    const value = parser.text;
    parser.text = "";
    switch (parser.xmlDeclName) {
      case "version": {
        parser.xmlDeclExpects = ["encoding", "standalone"];
        const version = value;
        parser.xmlDecl.version = version;
        // This is the test specified by XML 1.0 but it is fine for XML 1.1.
        if (!/^1\.[0-9]+$/.test(version)) {
          parser.fail("version number must match /^1\\.[0-9]+$/.");
        }
        // When forceXMLVersion is set, the XML declaration is ignored.
        else if (!(parser.opt.forceXMLVersion as boolean)) {
          parser.setXMLVersion(version);
        }
        break;
      }
      case "encoding":
        if (!/^[A-Za-z][A-Za-z0-9._-]*$/.test(value)) {
          parser.fail("encoding value must match \
/^[A-Za-z0-9][A-Za-z0-9._-]*$/.");
        }
        parser.xmlDeclExpects = ["standalone"];
        parser.xmlDecl.encoding = value;
        break;
      case "standalone":
        if (value !== "yes" && value !== "no") {
          parser.fail("standalone value must match \"yes\" or \"no\".");
        }
        parser.xmlDeclExpects = [];
        parser.xmlDecl.standalone = value;
        break;
      default:
        // We don't need to raise an error here since we've already raised one
        // when checking what name was expected.
    }
    parser.xmlDeclName = "";
    parser.state = S_XML_DECL_NAME_START;
    parser.requiredSeparator = true;
  },

  function sXMLDeclEnding(parser: StateTableThis): void {
    const c = parser.getCodeNorm();
    if (c === GREATER) {
      if (parser.piTarget !== "xml") {
        parser.fail("processing instructions are not allowed before root.");
      }
      else if (parser.xmlDeclName !== "version" &&
               parser.xmlDeclExpects.includes("version")) {
        parser.fail("XML declaration must contain a version.");
      }
      parser.xmlDeclName = "";
      parser.requiredSeparator = false;
      parser.piTarget = parser.text = "";
      parser.state = S_TEXT;
    }
    else {
      // We got here because the previous character was a ?, but the question
      // mark character is not valid inside any of the XML declaration
      // name/value pairs.
      parser.fail(
        "The character ? is disallowed anywhere in XML declarations.");
    }
    parser.xmlDeclPossible = false;
  },

  function sOpenTag(parser: StateTableThis): void {
    const c = parser.captureNameChars();
    if (c === EOC) {
      return;
    }

    const tag: SaxesTagIncomplete = parser.tag = {
      name: parser.name,
      attributes: Object.create(null) as Record<string, string>,
    };
    parser.name = "";

    if (parser.xmlnsOpt) {
      tag.ns = Object.create(null);
    }

    parser.onopentagstart(tag);
    parser.sawRoot = true;
    if (!parser.fragmentOpt && parser.closedRoot) {
      parser.fail("documents may contain only one root.");
    }

    switch (c) {
      case GREATER:
        parser.openTag();
        break;
      case FORWARD_SLASH:
        parser.state = S_OPEN_TAG_SLASH;
        break;
      default:
        if (!isS(c)) {
          parser.fail("disallowed character in tag name.");
        }
        parser.state = S_ATTRIB;
    }
  },

  function sOpenTagSlash(parser: StateTableThis): void {
    if (parser.getCode() === GREATER) {
      parser.openSelfClosingTag();
    }
    else {
      parser.fail("forward-slash in opening tag not followed by >.");
      parser.state = S_ATTRIB;
    }
  },

  function sAttrib(parser: StateTableThis): void {
    const c = parser.skipSpaces();
    if (c === EOC) {
      return;
    }
    if (isNameStartChar(c)) {
      parser.i = parser.prevI;
      parser.state = S_ATTRIB_NAME;
    }
    else if (c === GREATER) {
      parser.openTag();
    }
    else if (c === FORWARD_SLASH) {
      parser.state = S_OPEN_TAG_SLASH;
    }
    else {
      parser.fail("disallowed character in attribute name.");
    }
  },

  function sAttribName(parser: StateTableThis): void {
    const c = parser.captureNameChars();
    if (c === EQUAL) {
      parser.state = S_ATTRIB_VALUE;
    }
    else if (isS(c)) {
      parser.state = S_ATTRIB_NAME_SAW_WHITE;
    }
    else if (c === GREATER) {
      parser.fail("attribute without value.");
      parser.pushAttrib(parser.name, parser.name);
      parser.name = parser.text = "";
      parser.openTag();
    }
    else if (c !== EOC) {
      parser.fail("disallowed character in attribute name.");
    }
  },

  function sAttribNameSawWhite(parser: StateTableThis): void {
    const c = parser.skipSpaces();
    switch (c) {
      case EOC:
        return;
      case EQUAL:
        parser.state = S_ATTRIB_VALUE;
        break;
      default:
        parser.fail("attribute without value.");
        // Should we do this???
        // parser.tag.attributes[parser.name] = "";
        parser.text = "";
        parser.name = "";
        if (c === GREATER) {
          parser.openTag();
        }
        else if (isNameStartChar(c)) {
          parser.i = parser.prevI;
          parser.state = S_ATTRIB_NAME;
        }
        else {
          parser.fail("disallowed character in attribute name.");
          parser.state = S_ATTRIB;
        }
    }
  },

  function sAttribValue(parser: StateTableThis): void {
    const c = parser.getCodeNorm();
    if (isQuote(c)) {
      parser.q = c;
      parser.state = S_ATTRIB_VALUE_QUOTED;
    }
    else if (!isS(c)) {
      parser.fail("unquoted attribute value.");
      parser.state = S_ATTRIB_VALUE_UNQUOTED;
      parser.i = parser.prevI;
    }
  },

  function sAttribValueQuoted(parser: StateTableThis): void {
    // We deliberately do not use captureTo here. The specialized code we use
    // here is faster than using captureTo.
    const { q, chunk } = parser;
    let { i: start } = parser;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const code = parser.getCode();
      switch (code) {
        case q:
          parser.pushAttrib(parser.name,
                            parser.text + chunk.slice(start, parser.prevI));
          parser.name = parser.text = "";
          parser.q = null;
          parser.state = S_ATTRIB_VALUE_CLOSED;
          return;
        case AMP:
          parser.text += chunk.slice(start, parser.prevI);
          parser.state = S_ENTITY;
          parser.entityReturnState = S_ATTRIB_VALUE_QUOTED;
          return;
        case NL:
        case NL_LIKE:
        case TAB:
          parser.text += `${chunk.slice(start, parser.prevI)} `;
          start = parser.i;
          break;
        case LESS:
          parser.text += chunk.slice(start, parser.prevI);
          parser.fail("disallowed character.");
          return;
        case EOC:
          parser.text += chunk.slice(start);
          return;
        default:
      }
    }
  },

  function sAttribValueClosed(parser: StateTableThis): void {
    const c = parser.getCodeNorm();
    if (isS(c)) {
      parser.state = S_ATTRIB;
    }
    else if (c === GREATER) {
      parser.openTag();
    }
    else if (c === FORWARD_SLASH) {
      parser.state = S_OPEN_TAG_SLASH;
    }
    else if (isNameStartChar(c)) {
      parser.fail("no whitespace between attributes.");
      parser.i = parser.prevI;
      parser.state = S_ATTRIB_NAME;
    }
    else {
      parser.fail("disallowed character in attribute name.");
    }
  },

  function sAttribValueUnquoted(parser: StateTableThis): void {
    // We don't do anything regarding EOL or space handling for unquoted
    // attributes. We already have failed by the time we get here, and the
    // contract that saxes upholds states that upon failure, it is not safe to
    // rely on the data passed to event handlers (other than
    // ``onerror``). Passing "bad" data is not a problem.
    const c = parser.captureTo(ATTRIB_VALUE_UNQUOTED_TERMINATOR);
    switch (c) {
      case AMP:
        parser.state = S_ENTITY;
        parser.entityReturnState = S_ATTRIB_VALUE_UNQUOTED;
        break;
      case LESS:
        parser.fail("disallowed character.");
        break;
      case EOC:
        break;
      default:
        if (parser.text.includes("]]>")) {
          parser.fail("the string \"]]>\" is disallowed in char data.");
        }
        parser.pushAttrib(parser.name, parser.text);
        parser.name = parser.text = "";
        if (c === GREATER) {
          parser.openTag();
        }
        else {
          parser.state = S_ATTRIB;
        }
    }
  },

  function sCloseTag(parser: StateTableThis): void {
    const c = parser.captureNameChars();
    if (c === GREATER) {
      parser.closeTag();
    }
    else if (isS(c)) {
      parser.state = S_CLOSE_TAG_SAW_WHITE;
    }
    else if (c !== EOC) {
      parser.fail("disallowed character in closing tag.");
    }
  },

  function sCloseTagSawWhite(parser: StateTableThis): void {
    switch (parser.skipSpaces()) {
      case GREATER:
        parser.closeTag();
        break;
      case EOC:
        break;
      default:
        parser.fail("disallowed character in closing tag.");
    }
  },
];
