# @scout-ui/stickers

Framework-neutral Scout UI assets, metadata, definitions, and manifests. The
package contains no React code or dependency and is safe to evaluate on a
server.

```js
import { stickerDefinitions } from "@scout-ui/stickers";
import { wonkyStar } from "@scout-ui/stickers/definitions/wonky-star";
import starUrl from "@scout-ui/stickers/assets/wonky-star.svg";
```

Definitions resolve their packaged asset with `new URL(..., import.meta.url)`.
Direct asset subpaths allow consumers to select a single SVG without importing
the manifest. Artwork is CC0 1.0; package code remains MIT licensed.
