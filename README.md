# saxes

A sax-style non-validating parser for XML.

Saxes is a fork of [sax-js](https://github.com/isaacs/sax-js)
1.2.4. All references to sax in this project's documentation are
references to sax 1.2.4.

Designed with [node](http://nodejs.org/) in mind, but should work fine in
the browser or other CommonJS implementations.

## Notable Differences from sax-js.

* Saxes aims to be much stricter than sax-js with regards to XML
  well-formedness. sax-js, even in its so-called "strict mode", is not
  strict. It silently accepts structures that are not well-formed
  XML. Projects that need absolute compliance with well-formedness
  constraints cannot use sax-js as-is.
* Saxes does not support HTML, or anything short of XML.
* Saxes does not aim to support antiquated platforms.

## Regarding `<!DOCTYPE`s and `<!ENTITY`s

The parser will handle the basic XML entities in text nodes and
attribute values: `&amp; &lt; &gt; &apos; &quot;`. It's possible to
define additional entities in XML by putting them in the DTD. This
parser doesn't do anything with that. If you want to listen to the
`ondoctype` event, and then fetch the doctypes, and read the entities
and add them to `parser.ENTITIES`, then be my guest.

## Usage

```javascript
var saxes = require("./lib/saxes"),
  parser = saxes.parser();

parser.onerror = function (e) {
  // an error happened.
};
parser.ontext = function (t) {
  // got some text.  t is the string of text.
};
parser.onopentag = function (node) {
  // opened a tag.  node has "name" and "attributes"
};
parser.onattribute = function (attr) {
  // an attribute.  attr has "name" and "value"
};
parser.onend = function () {
  // parser stream is done, and ready to have more stuff written to it.
};

parser.write('<xml>Hello, <who name="world">world</who>!</xml>').close();

// stream usage
// takes the same options as the parser
var saxesStream = require("saxes").createStream(options)
saxesStream.on("error", function (e) {
  // unhandled errors will throw, since this is a proper node
  // event emitter.
  console.error("error!", e)
  // clear the error
  this._parser.error = null
  this._parser.resume()
})
saxesStream.on("opentag", function (node) {
  // same object as above
})
// pipe is supported, and it's readable/writable
// same chunks coming in also go out.
fs.createReadStream("file.xml")
  .pipe(saxesStream)
  .pipe(fs.createWriteStream("file-copy.xml"))
```

## Arguments

Pass the following arguments to the parser function.  All are optional.

`opt` - Object bag of settings regarding string formatting.  All default to `false`.

Settings supported:

* `trim` - Boolean. Whether or not to trim text and comment nodes.
* `normalize` - Boolean. If true, then turn any whitespace into a single
  space.
* `xmlns` - Boolean. If true, then namespaces are supported.
* `position` - Boolean. If false, then don't track line/col/position.

## Methods

`write` - Write bytes onto the stream. You don't have to do this all at
once. You can keep writing as much as you want.

`close` - Close the stream. Once closed, no more data may be written until
it is done processing the buffer, which is signaled by the `end` event.

`resume` - To gracefully handle errors, assign a listener to the `error`
event. Then, when the error is taken care of, you can call `resume` to
continue parsing. Otherwise, the parser will not continue while in an error
state.

## Members

At all times, the parser object will have the following members:

`line`, `column`, `position` - Indications of the position in the XML
document where the parser currently is looking.

`startTagPosition` - Indicates the position where the current tag starts.

`closed` - Boolean indicating whether or not the parser can be written to.
If it's `true`, then wait for the `ready` event to write again.

`opt` - Any options passed into the constructor.

`tag` - The current tag being dealt with.

And a bunch of other stuff that you probably shouldn't touch.

## Events

All events emit with a single argument. To listen to an event, assign a
function to `on<eventname>`. Functions get executed in the this-context of
the parser object. The list of supported events are also in the exported
`EVENTS` array.

When using the stream interface, assign handlers using the EventEmitter
`on` function in the normal fashion.

`error` - Indication that something bad happened. The error will be hanging
out on `parser.error`, and must be deleted before parsing can continue. By
listening to this event, you can keep an eye on that kind of stuff.
Argument: instance of `Error`.

`text` - Text node. Argument: string of text.

`doctype` - The `<!DOCTYPE` declaration. Argument: doctype string.

`processinginstruction` - Stuff like `<?xml foo="blerg" ?>`. Argument:
object with `name` and `body` members. Attributes are not parsed, as
processing instructions have implementation dependent semantics.

`sgmldeclaration` - Random SGML declarations. Stuff like `<!ENTITY p>`
would trigger this kind of event. This is a weird thing to support, so it
might go away at some point. saxes isn't intended to be used to parse SGML,
after all.

`opentagstart` - Emitted immediately when the tag name is available,
but before any attributes are encountered.  Argument: object with a
`name` field and an empty `attributes` set.  Note that this is the
same object that will later be emitted in the `opentag` event.

`opentag` - An opening tag. Argument: object with `name` and
`attributes`.  If the `xmlns` option is set, then it will contain
namespace binding information on the `ns` member, and will have a
`local`, `prefix`, and `uri` member.

`closetag` - A closing tag. Note that self-closing tags will have
`closeTag` emitted immediately after `openTag`.  Argument: tag name.

`attribute` - An attribute node.  Argument: object with `name` and
`value`.  If the `xmlns` option is set, it will also contains
namespace information.

`comment` - A comment node.  Argument: the string of the comment.

`opencdata` - The opening tag of a `<![CDATA[` block.

`cdata` - The text of a `<![CDATA[` block. Since `<![CDATA[` blocks can get
quite large, this event may fire multiple times for a single block, if it
is broken up into multiple `write()`s. Argument: the string of random
character data.

`closecdata` - The closing tag (`]]>`) of a `<![CDATA[` block.

`opennamespace` - If the `xmlns` option is set, then this event will
signal the start of a new namespace binding.

`closenamespace` - If the `xmlns` option is set, then this event will
signal the end of a namespace binding.

`end` - Indication that the closed stream has ended.

`ready` - Indication that the stream has reset, and is ready to be written
to.
