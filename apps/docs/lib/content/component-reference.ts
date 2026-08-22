import type { ComponentSlug } from "../registry";

export interface ComponentReferenceDetail {
  readonly typeName: string;
  readonly sourcePath: string;
  readonly exampleSlug: string;
  readonly usage: string;
  readonly keyboard: string;
  readonly touch: string;
  readonly reducedMotion: string;
  readonly ssr: string;
  readonly performance: string;
  readonly constraints: string;
}

export const componentReferenceDetails = {
  sticker: {
    typeName: "StickerProps",
    sourcePath: "packages/react/src/sticker/index.tsx",
    exampleSlug: "sticker-mood-board",
    usage:
      "Use Sticker for object-like artwork or custom content. Official definitions preserve their intrinsic cut line; raw consumer artwork can opt into wrapper treatment.",
    keyboard:
      "Static stickers never enter the tab order. An interactive Sticker renders a native button and receives normal keyboard activation.",
    touch:
      "Interactive stickers preserve the 44px target while shadow and rotation simplify on small surfaces.",
    reducedMotion:
      "The static visual remains; entrance and translation are removed while outline and hard-shadow feedback stay available.",
    ssr: "The Sticker leaf is unmarked and server-compatible. Event handlers belong below a consumer Client Component boundary.",
    performance:
      "Rendering is one semantic wrapper plus image or child content; no engine, observer, timer, or browser-global module work is used.",
    constraints:
      "Do not replace critical text labels with unexplained artwork or apply a second default cut line to official definitions.",
  },
  "sticker-badge": {
    typeName: "StickerBadgeProps",
    sourcePath: "packages/react/src/sticker-badge/index.tsx",
    exampleSlug: "sticker-mood-board",
    usage:
      "Choose static for labels, select for aria-pressed choice state, and remove for a whole-badge named removal action.",
    keyboard:
      "Select and remove modes render native buttons. Static mode renders a span and stays out of the tab order.",
    touch:
      "Badge rows wrap in reading order and use native button targets; no horizontal drag is required.",
    reducedMotion:
      "Selection and press remain visible through marks, borders, tone, and depth without translation.",
    ssr: "The unmarked leaf can render static serializable modes on the server; callbacks require a consumer Client Component.",
    performance:
      "Badge state is ordinary native control rendering with no continuous work or animation loop.",
    constraints:
      "A remove badge is one button, never a nested button. Compose separate sibling controls when selection and removal are both needed.",
  },
  "sticker-button": {
    typeName: "StickerButtonProps",
    sourcePath: "packages/react/src/sticker-button/index.tsx",
    exampleSlug: "campaign-navbar",
    usage:
      "Use the button branch for actions and the href branch for navigation. Loading is intentionally valid only for buttons.",
    keyboard:
      "Native button and anchor semantics provide expected activation, URL operations, and focus behavior.",
    touch:
      "All named sizes retain practical touch geometry and fullWidth is available when a mobile flow needs it.",
    reducedMotion:
      "Press feedback switches through color, outline, and hard-shadow state without spatial translation.",
    ssr: "The unmarked leaf is server-compatible for serializable button or anchor output; interactive callbacks need a client consumer.",
    performance:
      "Tactile feedback is CSS-only, loading preserves dimensions, and no runtime animation dependency is loaded.",
    constraints:
      "Do not use loading on anchors, hide meaningful text behind a spinner, or turn every action into the loudest control.",
  },
  "sticker-trail": {
    typeName: "StickerTrailProps / StickerTrailOptions",
    sourcePath: "packages/sticker-trail/src/StickerTrail.tsx",
    exampleSlug: "sticker-trail-hero",
    usage:
      "Scope Trail to one bounded region and supply your own sources or official definitions structurally.",
    keyboard:
      "Trail is decorative and never announces spawns. Underlying links, buttons, and selectable text remain the complete interaction.",
    touch:
      "Coarse pointers are off by default. Optional tap mode spawns only after a deliberate uncancelled tap and never captures scrolling.",
    reducedMotion:
      "No pointer listener or movement loop is registered; caller-rendered content remains as the static experience.",
    ssr: "The client leaf emits a deterministic inert pool for stable hydration. The standalone package root carries its narrow client directive.",
    performance:
      "Pointer samples are frame-coalesced, coordinates stay container-local, and a fixed recycled pool is capped by configured and hard limits.",
    constraints:
      "Avoid site-wide reading surfaces, data entry, unbounded node history, or using decorative spawns as required feedback.",
  },
  "sticker-cursor": {
    typeName: "StickerCursorProps / CursorVisual",
    sourcePath: "packages/react/src/sticker-cursor/StickerCursor.tsx",
    exampleSlug: "custom-cursor-canvas",
    usage:
      "Use Cursor only inside a clearly bounded visual canvas with artwork whose normalized hotspot matches the intended point.",
    keyboard:
      "Cursor visuals never appear as keyboard feedback and never replace focus rings or native semantic controls.",
    touch:
      "Coarse pointers and devices without hover retain the native cursor and attach no movement engine.",
    reducedMotion:
      "The native cursor remains authoritative and custom movement is not initialized.",
    ssr: "The client leaf renders an inert visual layer; capability checks and asset decoding occur only after hydration.",
    performance:
      "One node follows the latest sample once per frame, settle stops at epsilon, and the optional echo pool is capped at four.",
    constraints:
      "Never apply it across editors, forms, resize handles, native media, or the whole application. Readiness failure must keep native behavior.",
  },
  "sticker-peel": {
    typeName: "StickerPeelProps",
    sourcePath: "packages/react/src/sticker-peel/StickerPeel.tsx",
    exampleSlug: "peel-product-detail",
    usage:
      "Use Peel for optional secondary disclosure with a complete front and back layer—not required notices or irreversible actions.",
    keyboard:
      "The named native toggle handles Enter and Space. Focus moves before a layer becomes inert and Escape can close disclosure use.",
    touch:
      "Tap is the complete path. Drag waits for directional intent and begins pointer capture only after peel intent wins.",
    reducedMotion:
      "The semantic open state swaps immediately without spatial curl travel.",
    ssr: "Both layers remain mounted for meaningful, size-stable server output; the leaf is a narrow Client Component for state and focus management.",
    performance:
      "Drag progress writes one CSS variable per animation frame with zero high-frequency React state; cancellation restores prior state.",
    constraints:
      "Do not hide long documents, required instructions, or actions that depend on precise dragging.",
  },
  "sticker-stack": {
    typeName: "StickerStackProps<T>",
    sourcePath: "packages/react/src/sticker-stack/StickerStack.tsx",
    exampleSlug: "stacked-stories",
    usage:
      "Use Stack for a small ordered collection with stable keys, bounded visibleCount, and ordinary previous/next controls.",
    keyboard:
      "Buttons always work. Optional arrow-key behavior applies only when the stack itself is focused and never traps normal focus movement.",
    touch:
      "Swipe is an enhancement with axis intent; perpendicular page scrolling wins before stack intent is established.",
    reducedMotion:
      "The semantic index changes directly without travel; deterministic resting depth may remain.",
    ssr: "The leaf is client-marked because it owns state and gesture behavior. renderItem callbacks belong in a consumer Client Component.",
    performance:
      "Only visible cards plus at most one outgoing card render; drag uses refs/CSS variables and rapid navigation is synchronously gated.",
    constraints:
      "Do not use Stack for hundreds of records, primary navigation, dense forms, or content that must be simultaneously visible.",
  },
  "sticker-navbar": {
    typeName: "StickerNavbarProps / StickerNavItem",
    sourcePath: "packages/react/src/sticker-navbar/StickerNavbar.tsx",
    exampleSlug: "campaign-navbar",
    usage:
      "Use ribbon or collage around a short semantic navigation set; links remain anchors and custom renderers must preserve the supplied contract.",
    keyboard:
      "Desktop links are native anchors. The responsive menu uses Radix Dialog for focus containment, Escape, and return focus.",
    touch:
      "Below the menu breakpoint the complete enabled link group moves into one readable paper sheet; decoration crops instead of shrinking labels.",
    reducedMotion:
      "Ribbon and collage render in their composed resting state while active/current markers remain explicit.",
    ssr: "Semantic header, navigation, links, and decorative poster render on the server; the leaf owns a narrow client boundary for menu and scroll behavior.",
    performance:
      "Scroll progress is optional and compositor-friendly. Decorative assets are bounded and isolated from the functional layer.",
    constraints:
      "Do not collide ribbon paths with controls, obscure labels with collage art, or preserve desktop density at mobile widths.",
  },
} as const satisfies Record<ComponentSlug, ComponentReferenceDetail>;
