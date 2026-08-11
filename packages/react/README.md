# @scout-ui/react

React entry package for Scout UI. Production components are implemented in their
later milestones; the v0.1 CSS and typed token foundation is available now.

The package supports the root import plus explicit public subpaths. Import
`@scout-ui/react/styles.css` for the public stylesheet entry.

```tsx
import "@scout-ui/react/styles.css";
import { scoutUiTokens } from "@scout-ui/react";
```

The stylesheet exposes collision-resistant `--sui-*` custom properties and
paper/night, intensity, density, forced-colors, and reduced-motion behavior.
Consumers can override variables with plain CSS; no React theme provider,
Tailwind setup, CSS-in-JS runtime, or font download is required. The exported
`scoutUiTokens` metadata is generated from that same CSS source of truth.
