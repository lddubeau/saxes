## Write A Test

Isaac had established this rule for sax, it still goes for saxes:

**NO PATCHES WITHOUT A TEST**

**TEST MUST PASS WITH THE PATCH.**

**TEST MUST FAIL WITHOUT THE PATCH.**

**NO EXCEPTIONS.**

# EVERY PULL REQUEST MUST HAVE A TEST.

Seriously.  This is a very strict rule, and I will not bend it for any
patch, no matter how minor.

Write a test.

## Optimize for the Well-formed Case

Optimize your PR for well-formed documents. For instance, if a value is only
going to be useful for an error message, and requires additional processing to
compute, then don't compute it if the error does not occur.

This principle is why saxes continues producing data even when a well-formedness
error occurs. The XML specification forbids XML processors from continuing to
pass data when a such error occurs. They may only report other errors. However,
implementing the XML specification requirement would require that saxes
continually check whether it may emit non-error events and this would have a
measurable cost even when parsing well-formed documents. We decided always emit
the events anyway and diverge a bit from the XML specifications.

## Optimize for "Clean" XML

This is well-formed XML:

```xml
<foo a="1" b="2" c="3">something</foo>
```

This is also well-formed and represents the same document as the previous
example:

```xml
              <foo            a                =     "1"


b = "2"

c = "3"            >something</foo             >


```

We want both documents to be parsed without error by saxes but, when writing
code, optimize for the former rather than the later.

## Pay Attention to Performance

The more a PR harms performance,

1. The more justified the PR must be. The best justification for a drop in
performance is providing a fix that fixes a bug which causes saxes to not be
conformant.

2. The more likely we'll ask that the PR be optimized before merging.

3. The more likelihood it'll be ultimately rejected.

Please verify the performance impact before submitting the PR. An easy way to do
it is:

```terminal
$ node examples/null-parser.js examples/data/docbook.rng
```

You should run it before you make your change and after. Make sure you run it
when your CPU is relatively idle, and run it multiple times to get a valid
result. If the code takes 10 times longer with your change, you know you have a
problem. Address it before submitting your PR.

In general, we want both elegance and performance. However, in those cases where
one must be sacrificed for the other, **we are willing to sacrifice elegance in
favor of performance.** A good example of this is how saxes handles the
normalization of end-of-line (EOL) characters to newlines (NL). In September
2019 I (lddubeau) discovered that saxes was not doing the normalization
correctly. I came up with two fixes:

1. One fix modified the ``write`` method to split chunks on all EOL characters
   except NL, and would normalize those characters to NL early on. It would also
   adjust positioning data to handle skipping ``\r`` in the ``\r\n`` sequence,
   etc. It performed excellently with files containing only ``\n`` but it
   performed terribly with files that needed normalization. **However**, a file
   with ``\n`` as EOL would process half as fast if its EOL characters were
   replaced with ``\r\n`` prior to parsing. The performance for files using
   anything else than ``\n`` for EOL was atrocious.

   This approach was the more elegant of the two approaches mentioned here
   because it made all the logic normalizing EOL characters localized to one
   spot in the code. It was also the least error-prone approach, for the same
   reason. Adding a new ``captureSomething`` method would not run the risk of
   forgetting to handle EOL characters properly.

2. Another fix took the approach of recording state while running ``getCode``
   and using this state in all places where substrings are extracted from chunks
   to handle the presence of EOL characters. This fix performs about as fast as
   the other fix described above for files that contain ``\n`` as EOL, and maybe
   10-20% slower when a file contains ``\r\n``.

   This approach is definitely not as elegant as the first. It spreads the logic
   for handling EOL into multiple locations, and there's a risk of forgetting to
   add the proper logic when adding a new ``captureSomething`` method.

Of the two approaches, the 2nd one was the one selected for posterity. Though
the first method was more elegant, its performance was unacceptable.
