---
"@scout-ui/react": patch
---

Embed original sources in JavaScript source maps so installed packages do not
reference missing source files. Packed-package validation now rejects unresolved
source-map references. No public API changes.
