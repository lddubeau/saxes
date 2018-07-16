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
