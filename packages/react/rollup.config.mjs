import { createLibraryConfig } from "../../tooling/rollup/create-library-config.mjs";

export default createLibraryConfig({
  clientEntries: [
    // Rollup resolves the ergonomic root barrel through these implementation
    // chunks. Banner both the public leaf and the hook-owning chunk so an RSC
    // graph can inspect the unmarked barrel without absorbing client code.
    "src/sticker-cursor/StickerCursor.tsx",
    "src/sticker-cursor/index.ts",
    "src/sticker-navbar/StickerNavbar.tsx",
    "src/sticker-navbar/index.ts",
    "src/sticker-peel/StickerPeel.tsx",
    "src/sticker-peel/index.ts",
    "src/sticker-stack/StickerStack.tsx",
    "src/sticker-stack/index.ts",
    "src/sticker-trail/index.ts",
  ],
  input: [
    "src/index.ts",
    "src/sticker/index.tsx",
    "src/sticker-badge/index.tsx",
    "src/sticker-button/index.tsx",
    "src/sticker-cursor/index.ts",
    "src/sticker-navbar/index.ts",
    "src/sticker-peel/index.ts",
    "src/sticker-stack/index.ts",
    "src/sticker-trail/index.ts",
  ],
  external: [
    "@radix-ui/react-dialog",
    /^@scout-ui\//u,
    /^react(?:-dom)?(?:\/.*)?$/u,
  ],
});
