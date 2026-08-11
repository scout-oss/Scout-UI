# Scout UI Repository Guidance

The sibling `../scout-in` repository is Scout's reference implementation.

Before designing or implementing Scout UI, inspect the existing Scout visual
language, especially its sticker assets, teen experience, cursor and
sticker-trail interactions, navigation, typography, colors, motion patterns, and
other distinctive interface elements.

Use Scout as product context and inspiration, then extract reusable ideas into
generalized, standalone open-source APIs. Do not copy product-specific claims or
present planned Scout capabilities as live.

Do not modify `../scout-in` unless the user explicitly instructs you to do so.

Keep Scout UI independently buildable, testable, versioned, and publishable.
Scout should eventually be able to consume public `@scout-ui/*` packages as its
first production adopter.
