# Scout UI Engineering Specification

**Status:** Source of truth for v0.1 implementation architecture<br /> **Depends
on:** `SCOUT_UI_MASTER_SPEC.md`, `SCOUT_UI_DESIGN_SYSTEM.md`<br /> **Release
target:** v0.1<br /> **Primary runtime:** React with TypeScript<br />
**Architecture priority:** bounded interaction work, stable public APIs, minimal
package fragmentation

## 1. Architectural decisions

v0.1 uses a pnpm and Turborepo monorepo with one documentation application and
exactly three public packages:

- `@scout-ui/react`
- `@scout-ui/sticker-trail`
- `@scout-ui/stickers`

The existing `apps/playground` directory is removed during the foundation
milestone. Playground routes and infrastructure live inside `apps/docs`; a
separate application would duplicate configuration schemas, content, search,
deployment, and examples without providing isolation that v0.1 needs.

There is no public `core`, `tokens`, or `motion` package. Shared logic stays
inside its owning package. A private workspace package may be proposed later
only when real duplication across two public packages cannot be solved through a
dependency edge.

Packages are ESM-first and ESM-only in v0.1. Modern React, Next.js, Vite, and
standards-based bundlers consume ESM correctly. A CommonJS build adds export and
testing complexity and is added only when a documented consumer need exists.

The runtime does not require Tailwind CSS, Framer Motion, a theme provider, or a
client-side CSS-in-JS library. Components use scoped class names, CSS custom
properties, and small imperative engines where pointer frequency makes React
rendering inappropriate.

## 2. Target repository structure

```text
scout-ui/
├── apps/
│   └── docs/
│       ├── app/
│       │   ├── (marketing)/
│       │   ├── components/
│       │   ├── stickers/
│       │   ├── playground/
│       │   ├── examples/
│       │   ├── guides/
│       │   ├── changelog/
│       │   └── api/
│       ├── components/
│       ├── content/
│       ├── lib/
│       │   ├── component-registry/
│       │   ├── codegen/
│       │   ├── promptgen/
│       │   ├── playground/
│       │   └── search/
│       ├── public/
│       ├── tests/
│       └── package.json
├── packages/
│   ├── react/
│   │   ├── src/
│   │   │   ├── sticker/
│   │   │   ├── sticker-badge/
│   │   │   ├── sticker-button/
│   │   │   ├── sticker-trail/        # re-export leaf for the standalone package
│   │   │   ├── sticker-cursor/
│   │   │   ├── sticker-navbar/
│   │   │   ├── sticker-peel/
│   │   │   ├── sticker-stack/
│   │   │   ├── internal/
│   │   │   ├── shared-types.ts       # generic public types for broad consumers
│   │   │   ├── styles.css            # authored tokens/base/components/utilities
│   │   │   ├── tokens.generated.ts   # generated from styles.css, drift-checked
│   │   │   └── index.ts              # unmarked re-export barrel
│   │   ├── tests/
│   │   └── package.json
│   ├── sticker-trail/
│   │   ├── src/
│   │   │   ├── engine.ts
│   │   │   ├── geometry.ts
│   │   │   ├── pool.ts
│   │   │   ├── presets.ts
│   │   │   ├── sequence.ts
│   │   │   ├── types.ts              # locally owned generic structural types
│   │   │   ├── StickerTrail.tsx
│   │   │   ├── useStickerTrail.ts
│   │   │   ├── styles.css            # single source of truth for Trail rules
│   │   │   └── index.ts
│   │   ├── tests/
│   │   └── package.json
│   └── stickers/
│       ├── assets/
│       ├── src/
│       │   ├── definitions/
│       │   ├── manifest.ts
│       │   ├── types.ts
│       │   └── index.ts
│       ├── scripts/
│       ├── source/
│       ├── ATTRIBUTION.md
│       ├── LICENSE-ASSETS.md
│       └── package.json
├── fixtures/
│   ├── next-app/                     # broad-package consumer
│   └── react-vite/                   # broad plus standalone-only entry
├── tests/
│   └── browser/                      # Playwright specs against packed fixtures
├── tooling/
│   ├── eslint/
│   ├── typescript/
│   ├── rollup/                       # shared library config, static/CSS emit
│   ├── tokens/                       # token metadata generation and drift check
│   ├── fixtures/                     # packed-tarball consumer harness
│   └── test/
├── .changeset/
├── .github/
│   ├── workflows/
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.json
└── IMPLEMENTATION_PLAN.md
```

`fixtures` are private source templates. The test harness copies each fixture
outside the active workspace graph, injects packed local tarballs under their
public package names, creates an isolated lockfile, and installs with
`--frozen-lockfile`. Fixture code imports public names and exports only; neither
workspace links nor docs-only paths may mask packaging defects.

## 3. Workspace configuration

`pnpm-workspace.yaml` includes applications, packages, fixtures, and private
tooling packages if tooling becomes package-based:

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "fixtures/*"
  - "tooling/*"
```

The root `package.json` remains private, pins the package manager through
Corepack, and owns orchestration scripts only. Dependency versions shared across
workspaces use a pnpm catalogue or central version policy after the initial
dependency set is selected. Exact Node and pnpm versions are pinned during the
foundation milestone to the then-current supported LTS/toolchain and enforced in
CI.

Required root scripts:

```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "lint": "turbo run lint",
    "format": "prettier --check .",
    "format:write": "prettier --write .",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "test:browser": "turbo run test:browser",
    "test:visual": "turbo run test:visual",
    "check": "pnpm lint && pnpm typecheck && pnpm test && pnpm build",
    "changeset": "changeset",
    "release": "turbo run build && changeset publish"
  }
}
```

No lifecycle script performs an implicit network operation for a library
consumer.

## 4. Turborepo pipeline

The pipeline distinguishes persistent development tasks from deterministic build
and test outputs.

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        "dist/**",
        ".next/**",
        "!.next/cache/**",
        "public/_pagefind/**"
      ]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:browser": {
      "dependsOn": ["build"],
      "cache": false
    },
    "test:visual": {
      "dependsOn": ["build"],
      "cache": false
    },
    "lint:assets": {
      "outputs": []
    }
  }
}
```

The exact dependency of lint and typecheck on build may be removed if project
references provide generated types without a prior build. CI must not rely on a
developer's local cache.

## 5. Package dependency graph

```text
@scout-ui/stickers          React-free, no Scout UI runtime dependency

@scout-ui/sticker-trail     React peer dependency; accepts generic sources

@scout-ui/react
  ├── depends on @scout-ui/sticker-trail
  ├── accepts @scout-ui/stickers definitions structurally
  ├── has no runtime dependency on @scout-ui/stickers
  └── React / React DOM peer dependencies

apps/docs
  ├── @scout-ui/react
  ├── @scout-ui/sticker-trail
  └── @scout-ui/stickers
```

`@scout-ui/react` re-exports the trail component and types from the standalone
package. `@scout-ui/sticker-trail` does not depend on the official sticker pack,
so consumers can use their own URLs. `@scout-ui/react` accepts the
framework-neutral sticker definition shape but does not depend on
`@scout-ui/stickers`; the documentation application installs both directly.

`@scout-ui/stickers` contains no React source, JSX, component, hook, wrapper,
dependency, peer dependency, optional dependency, or React-specific export.
React conveniences for rendering a definition are implemented by `Sticker` and
the other components in `@scout-ui/react`.

Peer dependency policy supports the React major versions validated by consumer
fixtures. The range is not widened without tests. Duplicate React must never be
bundled.

### 5.1 Generic type ownership

`@scout-ui/sticker-trail` must not depend on `@scout-ui/react` or
`@scout-ui/stickers`, and v0.1 adds no shared package. The standalone package
therefore owns local declarations of the generic structural types it needs —
`StickerSource`, `NumberRange`, and `ScoutMotionPolicy` — and exports them for
standalone consumers.

This duplication is deliberate: the package graph matters more than forcing a
shared runtime or type package into existence. No runtime dependency may be
introduced merely to share an interface. The declarations must stay structurally
equivalent, and type-level parity assertions prove mutual assignability so the
shapes cannot silently drift.

`@scout-ui/react` remains the public home of the generic types for broad
consumers. It must not use `export * from "@scout-ui/sticker-trail"`, because
that would re-export a second copy of the generic names. It re-exports only the
Trail-specific public API:

```ts
export { StickerTrail, useStickerTrail } from "@scout-ui/sticker-trail";
export type {
  StickerTrailController,
  StickerTrailOptions,
  StickerTrailPreset,
  StickerTrailProps,
  UseStickerTrailOptions,
} from "@scout-ui/sticker-trail";
```

plus any genuinely Trail-specific type the implementation adds.

## 6. TypeScript architecture

All packages use strict TypeScript with:

- `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`;
- `verbatimModuleSyntax` and explicit type-only imports;
- modern ESM module resolution compatible with bundlers;
- declaration maps and source maps for published code;
- no implicit `any` in public or internal code;
- project references where they improve incremental builds.

Public types are authored rather than inferred from private implementation
objects when inference would expose unstable detail. All exported unions are
documented and tested with type-level assertions. DOM timer types use `number`
in browser code rather than Node-specific timer types.

The library never augments global JSX or DOM types. CSS custom-property typing
is additive through `style?: React.CSSProperties & ScoutStyleProperties` only
where consumers need component-specific variables.

## 7. Build and bundling

Packages use Rollup with preserved ES modules for the v0.1 build. Preserving
public entry modules is an RSC compatibility requirement: server-compatible
entries must remain unmarked, and client entry modules must retain their own
top-level `"use client"` directives. A flattened root bundle is prohibited even
if it appears to tree-shake correctly.

Build outputs:

- ESM JavaScript targeting the supported browser baseline;
- `.d.ts` and declaration maps;
- source maps;
- a preserved, minified `styles.css` entry;
- explicit component entry modules and their directives;
- copied sticker assets and manifest files;
- no bundled React, React DOM, or framework runtime.

Internal modules below an entry may be bundled only when doing so cannot move
code across a server/client boundary. Public component entry points remain
separate and tree-shakeable. Side effects are limited to CSS files and declared
explicitly. Build tests inspect emitted files and fail if the root gains a
client directive, a client entry loses its directive, or a server-compatible
entry imports browser-only code.

Representative package metadata for `@scout-ui/react`:

```json
{
  "name": "@scout-ui/react",
  "type": "module",
  "files": ["dist", "README.md", "LICENSE"],
  "sideEffects": ["**/*.css"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./sticker": {
      "types": "./dist/sticker/index.d.ts",
      "import": "./dist/sticker/index.js"
    },
    "./sticker-badge": {
      "types": "./dist/sticker-badge/index.d.ts",
      "import": "./dist/sticker-badge/index.js"
    },
    "./sticker-button": {
      "types": "./dist/sticker-button/index.d.ts",
      "import": "./dist/sticker-button/index.js"
    },
    "./sticker-trail": {
      "types": "./dist/sticker-trail/index.d.ts",
      "import": "./dist/sticker-trail/index.js"
    },
    "./sticker-cursor": {
      "types": "./dist/sticker-cursor/index.d.ts",
      "import": "./dist/sticker-cursor/index.js"
    },
    "./sticker-navbar": {
      "types": "./dist/sticker-navbar/index.d.ts",
      "import": "./dist/sticker-navbar/index.js"
    },
    "./sticker-peel": {
      "types": "./dist/sticker-peel/index.d.ts",
      "import": "./dist/sticker-peel/index.js"
    },
    "./sticker-stack": {
      "types": "./dist/sticker-stack/index.d.ts",
      "import": "./dist/sticker-stack/index.js"
    },
    "./styles.css": "./dist/styles.css",
    "./package.json": "./package.json"
  },
  "peerDependencies": {
    "react": "<validated range>",
    "react-dom": "<validated range>"
  }
}
```

The component subpaths above are required public API, not optional optimization.
Deep imports into `dist` and undeclared filesystem paths are unsupported.

## 8. React architecture

Components are function components using `forwardRef` only when the ref is
meaningful to the public API. Controlled and uncontrolled state follows the
conventional `value/defaultValue/onValueChange` pattern.

Rules:

- semantic elements are defaults; polymorphism is limited to components that
  genuinely need it;
- no provider is required for basic use;
- global defaults such as reduced intensity may be supplied by an optional
  `ScoutUIProvider`, but components still work independently and CSS variables
  remain the primary theme contract;
- high-frequency coordinates, velocity, drag progress, and pool state live in
  refs or engine objects, not React state;
- React state records low-frequency semantic changes such as open state, active
  index, menu state, and loading state;
- effects use deterministic cleanup and tolerate React Strict Mode setup/cleanup
  replay;
- client-only APIs are read inside effects or guarded helpers, never at module
  evaluation;
- callbacks exposed to consumers are semantic and rate-limited; raw
  pointer-frame callbacks are not public in v0.1.

Public modules are classified before implementation:

| Entry                            | Boundary                  | Reason                                                                                   |
| -------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------- |
| `@scout-ui/react`                | unmarked re-export barrel | preserves mixed server/client leaf boundaries                                            |
| `@scout-ui/react/sticker`        | server-compatible         | no hooks or browser APIs; interactive props require a client consumer                    |
| `@scout-ui/react/sticker-button` | server-compatible         | anchors/static states can render on the server; event handlers require a client consumer |
| `@scout-ui/react/sticker-badge`  | server-compatible         | static mode can render on the server; select/remove modes require a client consumer      |
| `@scout-ui/react/sticker-trail`  | client entry              | re-exports the interactive standalone component/hook                                     |
| `@scout-ui/react/sticker-cursor` | client entry              | effects, pointer state, and browser capabilities                                         |
| `@scout-ui/react/sticker-navbar` | client entry              | menu state, dialog behavior, and scroll behavior                                         |
| `@scout-ui/react/sticker-peel`   | client entry              | state and pointer/keyboard interaction                                                   |
| `@scout-ui/react/sticker-stack`  | client entry              | state and pointer/keyboard interaction                                                   |
| `@scout-ui/sticker-trail`        | client entry              | the entire package is an interactive React runtime                                       |
| `@scout-ui/stickers`             | React-free/server-safe    | assets and serializable metadata only                                                    |

The root `@scout-ui/react` module contains re-exports only, has no directive,
and is emitted without flattening its leaf modules. Broad imports remain
supported, while explicit subpaths make boundaries inspectable and give RSC
consumers the narrowest contract.

## 9. Public shared types

```ts
export type ScoutIntensity = "calm" | "playful" | "loud";
export type StickerTone =
  | "paper"
  | "ink"
  | "ultraviolet"
  | "acid"
  | "cyan"
  | "pink"
  | "cobalt"
  | "orange";

export interface StickerSource {
  id: string;
  src: string;
  width?: number;
  height?: number;
}

export interface NumberRange {
  min: number;
  max: number;
}

export interface ScoutMotionPolicy {
  reducedMotion?: "system" | "always";
}
```

`system` is the default. `always` lets a product choose the static behavior for
a component even when the operating system permits motion. A public option to
ignore an operating-system reduced-motion request is intentionally not provided;
internal tests control media-query results at the environment boundary.

## 10. Public component APIs

The following interfaces define the v0.1 contract. Minor naming refinements are
allowed before the first published alpha only if all three specifications and
examples are updated together.

### 10.1 Sticker

```ts
interface StickerVisualProps extends ScoutMotionPolicy {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number | string;
  tone?: StickerTone;
  material?: "flat" | "paper" | "photo" | "metallic";
  outline?: "none" | "ink" | "paper" | "cutline";
  shadow?: "none" | "stuck" | "lifted";
  rotation?: number;
  intensity?: ScoutIntensity;
  entrance?: "none" | "stick";
}

type StickerContentProps =
  | {
      source: StickerSource;
      children?: never;
      alt?: string;
    }
  | {
      source?: never;
      children: React.ReactNode;
      alt?: never;
    };

export type StickerProps =
  | (StickerVisualProps &
      StickerContentProps &
      Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> & {
        interactive?: false;
      })
  | (StickerVisualProps &
      StickerContentProps &
      Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
        interactive: true;
      });
```

Exactly one of `source` or `children` is enforced by the type contract. `alt`
maps to meaningful image text only when a source is rendered; an empty string is
the decorative default. A source renders through format-neutral image semantics
and can represent SVG, PNG, WebP, photographic, or material artwork. Source
artwork defaults to `outline="none"` because official `StickerDefinition` assets
already contain their cut line, ink outline, and transparent safe padding.
Consumer-rendered children default to `outline="cutline"`; either form may
choose an explicit wrapper outline. Wrapper treatment never clips source
padding. `interactive=true` renders a native button for object-like sticker
actions. Label-like actions use `StickerButton`, and selection labels use
`StickerBadge`.

### 10.2 StickerBadge

```ts
interface StickerBadgeSharedProps {
  children: React.ReactNode;
  leading?: React.ReactNode;
  tone?: StickerTone;
  shape?: "label" | "stamp" | "pill";
  size?: "compact" | "default" | "large";
  rotation?: number;
}

export type StickerBadgeProps =
  | (StickerBadgeSharedProps &
      React.HTMLAttributes<HTMLSpanElement> & {
        mode?: "static";
      })
  | (StickerBadgeSharedProps &
      Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & {
        mode: "select";
        selected: boolean;
        onSelectedChange: (selected: boolean) => void;
      })
  | (StickerBadgeSharedProps &
      React.ButtonHTMLAttributes<HTMLButtonElement> & {
        mode: "remove";
        removeLabel: string;
        onRemove: () => void;
      });
```

Static mode renders a `<span>`. Select mode renders a button with
`aria-pressed`. Remove mode renders the whole badge as a button named by
`removeLabel`; it contains no nested button. For tokens that need both selection
and removal, consumers compose sibling select and remove controls in a group
rather than nesting interactive elements.

### 10.3 StickerButton

```ts
interface StickerButtonSharedProps extends ScoutMotionPolicy {
  tone?: StickerTone;
  size?: "compact" | "default" | "large";
  shape?: "label" | "paper" | "pill";
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  fullWidth?: boolean;
}

export type StickerButtonProps =
  | (StickerButtonSharedProps &
      React.ButtonHTMLAttributes<HTMLButtonElement> & {
        href?: never;
        loading?: boolean;
        loadingLabel?: string;
      })
  | (StickerButtonSharedProps &
      React.AnchorHTMLAttributes<HTMLAnchorElement> & {
        href: string;
        loading?: never;
        loadingLabel?: never;
      });
```

`href` selects an anchor; its absence selects a button. This preserves native
semantics without cloning arbitrary children or adding a second public
component. `loading` is valid only for the button branch. Framework routers may
intercept the rendered anchor normally.

### 10.4 StickerTrail

```ts
export type StickerTrailPreset =
  "calm" | "scout" | "dense" | "floaty" | "chaos";

export interface StickerTrailOptions extends ScoutMotionPolicy {
  stickers: readonly StickerSource[];
  preset?: StickerTrailPreset;
  enabled?: boolean;
  size?: NumberRange;
  spacing?: NumberRange;
  lifetime?: number;
  maxActive?: number;
  rotation?: NumberRange;
  scale?: NumberRange;
  sequence?: "ordered" | "random";
  seed?: string | number;
  exit?: "fade" | "shrink" | "float";
  touch?: "none" | "tap";
  clip?: boolean;
}

export interface StickerTrailProps
  extends
    StickerTrailOptions,
    Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  children?: React.ReactNode;
  layerClassName?: string;
}

export interface UseStickerTrailOptions extends StickerTrailOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  layerRef: React.RefObject<HTMLElement | null>;
}

export interface StickerTrailController {
  clear(): void;
  pause(): void;
  resume(): void;
}

export function useStickerTrail(
  options: UseStickerTrailOptions,
): StickerTrailController;
```

`StickerTrailProps` composes `StickerTrailOptions` with the div attributes
directly. This was verified against the validated React type range rather than
assumed: `React.HTMLAttributes<HTMLDivElement>` declares only `translate` and
`color` among names that could collide, and neither `size`, `scale`, nor
`rotate` appears on it — those live on `AllHTMLAttributes`. No Trail option name
collides, so `Omit` removes `children` alone. If a future validated React
version introduces a collision, the fix is to extend the `Omit` list for the
actual conflicting names; Trail option names are not renamed to work around a
type utility.

The component renders a positioned wrapper and image-based layer. Applications
that cannot accept a wrapper use the hook with their own container and layer.
Trail sources are URLs or structurally compatible official sticker definitions;
arbitrary React renderers are intentionally excluded because changing arbitrary
subtrees during spawn would violate the fixed-pool performance contract. Presets
are resolved once into validated options; explicit values override presets.
Runtime values are clamped to documented safety bounds, including a hard maximum
active node count.

### 10.5 StickerCursor

```ts
export type StickerCursorState = "default" | "hover" | "active" | string;

export interface CursorVisual {
  source: StickerSource;
  hotspot?: { x: number; y: number };
}

export interface StickerCursorProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    ScoutMotionPolicy {
  children: React.ReactNode;
  visuals: Record<StickerCursorState, CursorVisual> & {
    default: CursorVisual;
  };
  enabled?: boolean;
  size?: number;
  tilt?: number;
  smoothing?: number;
  clickFeedback?: "none" | "press" | "echo";
  hideNative?: "when-ready" | "never";
  stateAttribute?: string;
  disabledSelector?: string;
  layerClassName?: string;
}
```

The default state attribute is `data-sticker-cursor`. Editable elements, native
media controls, resize handles, and `[data-sticker-cursor="native"]` always
restore the native cursor. Custom state names select matching visuals without
changing the hotspot unless explicitly defined.

#### Hotspot coordinates

`hotspot` is expressed in **normalised rendered-box coordinates**: `x` and `y`
are fractions of the visual's rendered width and height, in the range 0–1, where
`{ x: 0, y: 0 }` is its top-left corner and `{ x: 1, y: 1 }` its bottom-right.
The default is the centre, `{ x: 0.5, y: 0.5 }`.

Coordinates are normalised rather than expressed in pixels because the hotspot
must stay under the pointer when a state change swaps in artwork with different
intrinsic dimensions, and when `size` overrides those dimensions entirely. A
pixel hotspot would silently drift under either. The value is applied as a
percentage translation of the visual's own box, so the same declaration remains
correct at every rendered size.

A missing hotspot resolves to the centre. Values outside the range — negative,
greater than one, or non-finite — are clamped into it rather than rejected, so
invalid configuration can never push the artwork away from the pointer. Each
state declares its own hotspot; the engine applies the hotspot belonging to the
artwork actually displayed, including when a state falls back to the default
visual because its own artwork has not decoded.

### 10.6 StickerNavbar

```ts
export interface StickerNavItem {
  id: string;
  label: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
}

export interface StickerNavbarProps
  extends React.HTMLAttributes<HTMLElement>, ScoutMotionPolicy {
  variant?: "ribbon" | "collage";
  brand: React.ReactNode;
  items: readonly StickerNavItem[];
  activeId?: string;
  action?: React.ReactNode;
  switcher?: React.ReactNode;
  collage?: readonly StickerSource[];
  ribbonPath?: string;
  sticky?: boolean;
  showScrollProgress?: boolean;
  menuLabel?: string;
  closeMenuLabel?: string;
  onNavigate?: (item: StickerNavItem) => void;
  renderLink?: (
    item: StickerNavItem,
    props: {
      className: string;
      "aria-current"?: "page";
      onClick: React.MouseEventHandler<HTMLAnchorElement>;
    },
  ) => React.ReactNode;
}
```

Links remain anchors. The default renderer emits a normal `href`; `renderLink`
supports framework routing and must ultimately render an anchor with the
supplied accessibility and event props. Development warnings flag a renderer
that does not produce a link. Disabled navigation items are omitted unless
documentation context requires them.

The v0.1 defaults are `variant="ribbon"`, `sticky=false`,
`showScrollProgress=false`, `menuLabel="Open navigation menu"`, and
`closeMenuLabel="Close navigation menu"`. These defaults keep the minimal render
semantic and decorative without opting a consumer into sticky layout or global
scroll work. The internal navigation landmark is named "Primary navigation";
consumer `React.HTMLAttributes<HTMLElement>` apply to the outer `<header>`
rather than being split across semantic roots.

`external=true` means the default anchor opens a new browsing context with
`target="_blank"` and `rel="noopener noreferrer"`. A custom `renderLink` owns
its router-specific destination behavior but still receives the complete item so
it can preserve the same contract. Disabled items are omitted from both desktop
and Dialog navigation. Because v0.1 exposes no priority field, the entire
enabled item group moves from inline navigation into the responsive Dialog below
the menu breakpoint; no undocumented priority, desktop-only, or mobile-only
semantics are inferred.

Sticky integration exposes `--sui-navbar-sticky-offset`, whose responsive
default resolves from the nominal `--sui-navbar-height`. Both defaults are
declared on Scout UI theme roots so sibling anchor targets can consume them.
Consumers apply the offset to targets through `scroll-margin-top`; if custom
slot content makes the bar taller, override both properties on the shared theme
root. The Navbar does not continuously mutate the document root.

### 10.7 StickerPeel

```ts
export interface StickerPeelProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
    ScoutMotionPolicy {
  front: React.ReactNode;
  back: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  origin?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  peelSize?: number | string;
  drag?: boolean;
  dragThreshold?: number;
  revealLabel?: string;
  closeLabel?: string;
  disabled?: boolean;
}
```

The semantic toggle is always present. Drag updates a CSS variable imperatively
and commits only the final open state to React. The front and back remain
mounted by default to preserve semantics and size; inertness and visibility are
managed according to state. An opt-in lazy back layer may be considered after
hydration and accessibility tests.

### 10.8 StickerStack

```ts
export interface StickerStackProps<T>
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    ScoutMotionPolicy {
  items: readonly T[];
  getKey: (item: T) => React.Key;
  renderItem: (
    item: T,
    context: { active: boolean; index: number },
  ) => React.ReactNode;
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  visibleCount?: 2 | 3 | 4 | 5;
  loop?: boolean;
  axis?: "x" | "y";
  drag?: boolean;
  keyboard?: boolean;
  nextLabel?: string;
  previousLabel?: string;
  empty?: React.ReactNode;
  disabled?: boolean;
}
```

Only visible layers render by default. The active item owns interactive
semantics; background layers receive `inert` and are hidden from assistive
technology. Consumer data is not cloned or mutated. Controlled index changes are
normalized when item count changes, and callbacks are not fired during render.

The v0.1 defaults are `visibleCount=3`, `loop=false`, `axis="x"`, `drag=false`,
and `keyboard=false`. The default control labels are “Next item” and “Previous
item”. These defaults keep the minimal render bounded, finite, button-operable,
and free of gesture or keyboard interception until the consumer opts into those
enhancements.

## 11. CSS architecture

The library ships one explicit stylesheet per public package and may expose
documented component subpath styles later. Consumers import:

```ts
import "@scout-ui/react/styles.css";
```

Trail rules are authored exactly once, in
`packages/sticker-trail/src/styles.css`. That file is the single source of truth
for Trail styling and is published verbatim as
`@scout-ui/sticker-trail/styles.css`.

The React package build composes the same authored Trail rules into its own
`dist/styles.css` through a deterministic build-time step, so the broad package
needs one CSS import. The composition strips the Trail stylesheet's redundant
cascade-layer order statement, appends the remaining rules after the React
component rules, and preserves layer ordering. Trail rules are never hand-copied
into a second source file, and the React source stylesheet is never rewritten
into a generated mixed-source file.

The consumer contract is exclusive:

- a broad consumer imports `@scout-ui/react/styles.css` and must **not** also
  import the standalone Trail stylesheet;
- a standalone consumer imports `@scout-ui/sticker-trail/styles.css` and needs
  neither `@scout-ui/react` nor its stylesheet.

Because a standalone consumer has no token layer, every Trail declaration that
reads a `--sui-*` token supplies an inline fallback value.

Packaging tests verify that the standalone stylesheet works independently, that
the broad stylesheet contains the Trail rules, that it contains them exactly
once, that broad usage needs no standalone CSS import, and that standalone usage
needs no React package.

Class names use a collision-resistant `sui-` prefix and BEM-like component
structure. CSS cascade layers establish order:

```css
@layer scout-ui.tokens, scout-ui.base, scout-ui.components, scout-ui.utilities;
```

The base layer does not reset global elements. It defines only component-scoped
box sizing and inherited variables. Themes are CSS custom properties on
`.sui-theme` or any consumer-selected ancestor.

Every Scout UI custom property, including implementation-only ones, is a valid
kebab-case name inside the `--sui-*` namespace. The distinction between public
and internal variables is contractual and documentary, not syntactic:

- **public variables** are documented, supported customization points and part
  of the public styling contract;
- **internal variables** stay inside the same namespace, are not documented as
  customization API, may change without a public API change, and must not be
  relied upon by examples.

Internal variables are marked by an `internal` name segment — for example
`--sui-trail-internal-x` — so that intent is readable in emitted CSS. The
Stylelint `custom-property-pattern` rule remains the enforcement mechanism and
is not weakened to admit underscore-prefixed names.

Tailwind examples map to CSS variables but the runtime emits no Tailwind classes
and does not require a Tailwind plugin.

## 12. Token architecture

Canonical tokens live in CSS plus a generated TypeScript metadata file for
documentation controls. CSS is the runtime source of truth; TypeScript is
generated and checked for drift.

Token groups are foundation, accent, semantic, typography, spacing, shape,
outline, shadow, motion, intensity, and layer. Themes override semantic tokens
rather than component selectors. Component variables resolve from semantic
tokens and allow local override:

```css
.sui-sticker-button {
  --sui-button-bg: var(--sui-ultraviolet);
  --sui-button-fg: white;
  --sui-button-offset: var(--sui-shadow-offset-md);
}
```

No runtime token parser or JavaScript theme object is required.

## 13. Sticker asset architecture

`@scout-ui/stickers` is framework-neutral and definitively React-free. Its
published manifest has no React or React DOM dependency, peer dependency, or
optional dependency, and its export map contains only serializable definitions,
manifests, metadata, package information, and asset files. Each asset has:

```ts
export interface StickerDefinition {
  readonly id: string;
  readonly name: string;
  readonly category: "signal" | "expression" | "direction" | "object" | "label";
  readonly tags: readonly string[];
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly viewBox?: string;
  readonly transparentBounds: StickerTransparentBounds;
  readonly dominantTone: string;
  readonly format: "svg" | "png" | "webp";
  readonly creator: string;
  readonly source: string;
  readonly license: string;
  readonly attributionStatus: "not-required" | "required" | "included";
  readonly attribution?: string;
  readonly sourceFile: string;
  readonly editableSource: string;
  readonly aiAssistance?: string;
  readonly checksum: string;
}
```

Provenance fields are mandatory even under CC0: `creator`, `source`,
`attributionStatus`, `editableSource`, and `checksum` are what make the pack
auditable. `transparentBounds` records the authored safe padding so consumers
can reason about optical sizing without measuring artwork at runtime.

The first four fields of `StickerDefinition` — `id`, `src`, `width`, `height` —
make every official definition structurally assignable to `StickerSource`, which
is how `@scout-ui/react` and `@scout-ui/sticker-trail` accept official artwork
without depending on the pack.

SVG is preferred for flat artwork; photographic/material cutouts use optimized
WebP with PNG fallback only when required. Masters are stored in an appropriate
source directory or release archive, while npm includes distribution assets.

The build validates unique IDs, dimensions, transparent bounds, file size,
manifest parity, license fields, forbidden embedded scripts, external
references, and accidental Scout trademarks. SVG optimization uses a locked
configuration that preserves view boxes and accessible rendering. Runtime code
never injects arbitrary SVG strings with `dangerouslySetInnerHTML`; trusted
packaged SVGs load as assets, and consumer React nodes remain the consumer's
responsibility.

Generated definitions resolve `src` with
`new URL("../assets/<id>.svg", import.meta.url).href`, and explicit wildcard
asset exports allow direct imports such as `@scout-ui/stickers/assets/<id>.svg`.
Both paths are verified from packed tarballs in Next.js and Vite fixtures. The
package does not inline the complete sticker pack into its root JavaScript
entry.

The frozen v0.1 official pack contains SVG files, so its alpha export map
exposes the concrete `./assets/*.svg` family only. The public definition and
React rendering contracts remain format-agnostic for PNG and WebP. A
format-specific raster asset export is added, with a specification update,
Changeset, fixture, and intentional API snapshot update, when the first cleared
asset in that format actually ships; an empty wildcard that resolves no file is
not advertised as public API.

## 14. Motion architecture

CSS transitions and keyframes implement button, badge, sticker, and simple
navbar motion. Pointer-following and drag interactions use Pointer Events plus
`requestAnimationFrame`. A large animation dependency is not part of the
runtime.

Shared motion values are CSS variables. Small internal helpers cover
reduced-motion matching, numeric clamping, frame scheduling, seeded randomness,
and velocity smoothing. They remain private until a stable cross-package need is
proven.

Web Animations API may be used for finite exit animations when it reduces React
work and provides reliable cancellation. Every animation handle is cancelled on
recycle or cleanup. Animation completion is never required to restore semantics.

## 15. StickerTrail engine

### 15.1 Event capture

The wrapper or hook target registers passive `pointermove`, `pointerenter`,
`pointerleave`, `pointerup`, and `pointercancel` listeners through an
`AbortController`. Mouse and pen may run when the capability policy permits;
touch runs only in `tap` mode. The engine never calls `preventDefault` for trail
behavior.

`pointermove` stores the latest sample and schedules one frame if none is
pending. It does not set React state, create DOM nodes, read layout, or update
styles directly.

### 15.2 Coordinates and layout reads

The engine stores the container's bounding rectangle on pointer entry and
refreshes it when a `ResizeObserver`, relevant scroll event, or viewport resize
marks geometry dirty. A frame performs at most the required geometry read before
writes. Local coordinates are `clientX - rect.left` and `clientY - rect.top`,
adjusted for the layer's border box if needed.

The default layer clips to the container. `clip=false` is allowed only when the
consumer provides an overflow-safe containing block; documentation warns that it
can create page overflow.

### 15.3 Distance and velocity

For successive samples:

```text
distance = hypot(dx, dy)
instantVelocity = distance / max(deltaTime, 1)
smoothedVelocity = previousVelocity × 0.35 + instantVelocity × 0.65
spacing = clamp(baseSpacing + smoothedVelocity × velocityFactor, min, max)
```

Distance accumulates across frames. When accumulated distance exceeds spacing,
spawn positions are interpolated along the segment. A frame has a strict spawn
cap; a long tab suspension or pointer teleport resets the segment instead of
filling hundreds of historical points.

### 15.4 Node pool

The React component renders a fixed pool of `maxActive` presentation nodes once.
The hook requires the caller's layer to allow the engine to create the same
bounded pool during setup. Nodes are recycled; normal movement does not append
or remove elements.

Each slot stores active status, birth time, lifetime, source index, position,
size, rotation, scale, and exit mode in an engine-side typed record. Recycling
cancels any Web Animation and clears source-specific attributes. The oldest
eligible slot is reused when the pool is full.

### 15.5 Frame loop

One frame:

1. refreshes geometry if dirty;
2. consumes the latest pointer sample;
3. calculates interpolation and activates a bounded number of slots;
4. updates active slot lifecycle progress;
5. writes transforms, opacity, and visibility in one phase;
6. schedules another frame only if a pointer sample is pending or an active exit
   needs progress.

Transforms use `translate3d`, `rotate`, and `scale`; opacity handles fades.
Width/height are assigned only when a slot activates, not on every frame.
`will-change` is limited to active pool nodes and removed or neutralized when
inactive where browser behavior benefits.

### 15.6 Visibility and cleanup

An `IntersectionObserver` pauses spawning when the container is offscreen.
`visibilitychange` resets frame timestamps and avoids catch-up work. Cleanup
aborts listeners, disconnects observers, cancels the pending frame, cancels
animations, clears sources, and restores all mutated styles.

Strict Mode setup/cleanup cycles leave no duplicate listeners. A development
test tracks active listener, observer, and frame counts across repeated
mount/unmount.

### 15.7 Safety limits

Three concepts are deliberately separate and are encoded as separate constants:

1. **The engine hard ceiling** — an absolute bound that nothing may exceed. It
   is not a default and is never a preset value.
2. **The preset value** — the tuned default a named preset contributes.
3. **The consumer value** — an explicit option, which overrides the preset and
   is then clamped by the hard ceiling.

Hard bounds, validated in performance tests:

- `maxActive`: 4–48;
- lifetime: 150–5000ms;
- size: 16–256px;
- rotation: within ±180°, presets within design limits;
- spawns per frame: maximum 6;
- no immediate repeat when multiple sticker sources exist.

The default `maxActive` when no preset applies is 24. `chaos` changes visual
variance only; its preset `maxActive` equals `dense`'s and must never drift
upward toward the absolute ceiling. Tests assert each preset's value explicitly
and assert separately that every preset stays at or below the hard ceiling, so
one cannot silently become the other.

### 15.8 SSR and reduced motion

Server output contains the wrapper, layer, and inert fixed pool with empty
sources, producing stable hydration. The engine starts only after mount and
capability checks. Under reduced motion it does not register pointer movement or
run a frame loop. The optional static fallback is ordinary caller-rendered
content, not an active pool item.

### 15.9 Touch

In `tap` mode, the engine records `pointerdown` but spawns only on `pointerup`
when travel and duration remain inside tap thresholds. It ignores cancelled
gestures and never captures the pointer, preventing interference with scroll and
browser navigation.

## 16. StickerCursor engine

The cursor engine shares concepts with Trail but remains inside
`@scout-ui/react` because its target-state resolution and visual component
contract differ.

- One cursor node is rendered; optional echo uses a pool capped at four.
- Pointer events store the latest local sample and hovered state.
- A frame updates position and a smoothed velocity tilt.
- Settle frames continue only until velocity and rotation fall below epsilon.
- State resolution walks the event target's closest matching data attribute and
  disabled selectors.
- Asset images decode before the ready flag hides the native cursor.
- `cursor: none` is applied through a scoped class only while ready and only
  inside the target.
- Pointer leave, window blur, visibility change, capability change, error, and
  unmount immediately restore the native cursor.
- Text inputs, textareas, contenteditable elements, native media controls, and
  explicit native regions bypass the custom cursor.
- Coarse pointers, lack of hover, and reduced motion keep the native cursor and
  do not attach the movement loop.

No cursor position is stored in React state. Semantic state changes may update a
ref and data attribute without re-rendering the wrapper.

## 17. StickerPeel implementation

The component uses React state only for controlled/uncontrolled open state.
Hover and drag progress update CSS variables on the root element. Pointer drag
is enhanced behavior:

- pointer down begins only on the grip;
- the grip captures that pointer during an active drag;
- local movement maps to a clamped 0–1 progress according to origin;
- frame-coalesced writes update `--sui-peel-progress`;
- pointer up commits open or closed according to threshold and velocity;
- cancel restores the previous semantic state;
- keyboard and click toggle without using the drag engine.

The front and back remain in logical DOM order. Inactive content uses `inert`,
`aria-hidden`, and visibility rules so it is not focusable twice. If inert
support is outside the selected browser baseline, the implementation includes a
focused fallback or narrows support explicitly.

The visual peel uses CSS transforms and pseudo-elements by default. A complex
mesh, canvas, or WebGL dependency is out of scope.

## 18. StickerStack implementation

The stack renders at most `visibleCount` items plus outgoing item during a
transition. Order, offsets, and rotations derive deterministically from the
active index and item keys.

React state holds uncontrolled index and transition phase. Drag position lives
in refs and CSS variables. Pointer capture begins only after the active card
receives a valid primary-pointer down. The engine locks to the configured axis
after a small movement threshold. Vertical page scroll must win when horizontal
drag intent is not established.

On commit, the semantic index updates once; CSS completes the reorder. Rapid
input is either queued once or ignored until the transition completes, with
controls visibly busy but not announced as application loading. Reduced motion
commits directly.

Background items are `inert` and `aria-hidden`. Next/previous buttons remain
available even when drag is enabled. The component announces the new item as
“Item X of Y” in a polite live region without reading all content automatically.

## 19. StickerNavbar implementation

The navbar renders semantic `<header>` and `<nav>` structures. Links remain
anchors. The ribbon is a static SVG path with rounded stroke and a clip-path
reveal; path morphing is not used in v0.1. The collage is a decorative
background layer with all images hidden from assistive technology and isolated
from the functional link layer.

Mobile navigation uses Radix Dialog scoped to `StickerNavbar` rather than a
custom focus trap. It supplies modal focus management, Escape behavior, outside
interaction handling, and return focus. Bundle impact is measured and
documented, and the dependency remains tree-shakeable for consumers who do not
import Navbar. The project will not ship a hand-rolled incomplete modal. The
initial v0.1 implementation pins `@radix-ui/react-dialog` `1.1.23` as an
`@scout-ui/react` runtime dependency; unrelated packages are not upgraded.

Scroll progress uses a passive scroll source or Intersection Observer-derived
section state and a compositor-friendly scale transform. It is optional and
decorative. Sticky offsets are exposed through a CSS variable for anchor
`scroll-margin-top` integration.

## 20. SSR and framework compatibility

All package modules are safe to import in a server environment. Module scope
must not read `window`, `document`, `navigator`, media queries, element
constructors, or computed styles.

React defines `"use client"` over the module dependency graph, and Next.js
recommends that library authors place it on entry points that rely on
client-only features rather than on a broad package surface. The implementation
follows the
[React directive reference](https://react.dev/reference/rsc/use-client) and
[Next.js library-author guidance](https://nextjs.org/docs/app/getting-started/server-and-client-components#third-party-components).

The RSC boundary contract is:

- `@scout-ui/react` is a zero-logic, unmarked barrel that re-exports preserved
  leaf entry modules.
- `sticker`, `sticker-button`, and `sticker-badge` carry no directive and use no
  hook, context, effect, or browser API. Static/serializable usages may execute
  as Server Components; the same definitions may run under a consumer's client
  boundary when event handlers are required.
- `sticker-trail`, `sticker-cursor`, `sticker-navbar`, `sticker-peel`, and
  `sticker-stack` each carry a top-level `"use client"` directive in their
  public leaf entry.
- The standalone `@scout-ui/sticker-trail` root carries `"use client"` because
  its entire public runtime is interactive.
- `@scout-ui/stickers` has no React boundary because it contains no React code.

Client-entry props passed directly from a Server Component must remain
serializable, as required by React/Next.js. Props such as `renderItem`,
`renderLink`, `onOpenChange`, or other callbacks require the consumer to
instantiate that component below its own client boundary. Documentation shows
both the direct serializable case and the client-wrapper case.

The build preserves these files as separate modules. It must not concatenate
client code into the root barrel, copy `"use client"` onto server-compatible
entries, or strip it from interactive entries. The root convenience import
remains supported:

```tsx
import { Sticker, StickerTrail } from "@scout-ui/react";
```

Explicit subpaths are the recommended form when a consumer wants an auditable
RSC boundary or the narrowest import:

```tsx
import { Sticker } from "@scout-ui/react/sticker";
import { StickerTrail } from "@scout-ui/react/sticker-trail";
```

SSR output is meaningful and size-stable:

- buttons, badges, navbar links, peel layers, and stack active content render
  semantically;
- cursor and trail layers render inert;
- hydration does not use random values generated independently on server and
  client;
- seeded or decorative rotations are derived from stable props/keys;
- browser capability decisions occur after hydration.

Consumer fixtures cover:

- a Next.js App Router Server Component rendering `Sticker`, an anchor
  `StickerButton`, and static `StickerBadge` from both root and subpath imports;
- a Server Component directly rendering client entries with serializable props;
- a small user-authored Client Component passing callbacks and render functions
  to interactive entries;
- a client page using the broad root import;
- a Vite React application using root and subpath imports.

The Next.js production build is inspected to ensure a server-compatible subpath
does not become a client boundary and importing only `Sticker` does not pull
Trail, Cursor, Navbar, Peel, or Stack into the client chunk.

## 21. Browser support

The release supports current stable evergreen Chromium, Firefox, and Safari
versions represented by a documented Playwright and manual Safari matrix. Exact
minimum versions are frozen during the foundation milestone and published with
each release.

Required platform features include ESM, CSS custom properties, Pointer Events,
`requestAnimationFrame`, `matchMedia`, `ResizeObserver`, `IntersectionObserver`,
and `AbortController`. Where a feature affects only an enhancement, the
component degrades. Scout UI does not silently ship broad polyfills into
consumer applications.

Capability queries—`(hover: hover)`, `(pointer: fine)`, reduced motion, forced
colors—drive behavior instead of user-agent sniffing.

## 22. Accessibility architecture

Accessibility is enforced at three levels:

1. semantic component code and public API constraints;
2. automated checks in component/docs browser tests; and
3. manual keyboard, zoom/reflow, forced-colors, screen-reader, motion, and touch
   review.

The project uses axe in browser tests but does not treat zero automated
violations as full compliance. Interactive components document roles, names,
state, focus behavior, live announcements, drag alternatives, and reduced-motion
behavior.

Decorative engine layers use `aria-hidden="true"`, `role="presentation"` where
relevant, empty alt text, `pointer-events: none`, and no tab stops.
Focus-visible styling is component-owned and remains visible at 200% zoom and
under overlap.

## 23. Documentation application

`apps/docs` uses Next.js App Router and TypeScript. Content is MDX for prose
plus typed registries for interactive examples. The site statically renders as
much content as possible; playground canvases hydrate only where needed.

Each component has one registry entry:

```ts
export interface ComponentDocDefinition<C extends JsonObject> {
  slug: string;
  name: string;
  packageName: "@scout-ui/react" | "@scout-ui/sticker-trail";
  status: "alpha" | "beta" | "stable";
  defaults: C;
  schema: ConfigSchema<C>;
  presets: readonly ConfigPreset<C>[];
  renderPreview(config: C): React.ReactNode;
  generateCode(config: C, context: CodegenContext): string;
  generatePrompt(config: C, context: PromptContext): string;
  searchTerms: readonly string[];
}
```

The same definition drives component pages, full playground routes, generated
output, share URLs, and documentation tests. No configuration value should be
manually represented in four separate systems.

## 24. Playground schema

Configuration schemas support boolean, number, range, select, segmented, color,
sticker selection, and short text fields. Every field defines:

- stable key;
- label and description;
- default;
- validation and normalization;
- control group;
- serialization policy;
- code-generation formatter;
- prompt-generation description;
- visibility condition if dependent on another field;
- whether it is safe to include in a share URL.

Schemas contain data and pure functions only. They do not evaluate arbitrary
source strings. Defaults are versioned with the component documentation.

## 25. Generated code

Code generation is deterministic and template-based. It does not execute user
input or build an arbitrary AST from free-form text.

Each generator:

1. validates and normalizes config;
2. chooses required package and style imports;
3. includes non-default props in stable schema order;
4. generates any required sticker array with bundled IDs or clear placeholders;
5. prints a complete component example;
6. escapes string literals;
7. returns stable formatted text.

Generators run in the browser for live updates and in Node tests. Output is
parsed by the TypeScript compiler in tests and compiled in representative
snapshots. The docs never display code that relies on private registry helpers.

Copy uses the asynchronous Clipboard API over a user gesture. On failure, the UI
selects visible text and provides a manual fallback. Copy success is a polite
live announcement and does not expose copied content to analytics.

## 26. Copy AI Prompt architecture

Prompt generation is local, deterministic, and configuration-aware. It does not
call an AI service.

```ts
export interface PromptContext {
  framework: "react" | "next-app-router" | "next-pages-router" | "unknown";
  targetLocation?: string;
  assetStrategy: "bundled" | "local" | "remote" | "unknown";
  preserveLayout: boolean;
  detail: "concise" | "detailed";
}

export interface PromptSection {
  id: string;
  title: string;
  lines: readonly string[];
}
```

Templates assemble these ordered sections:

1. objective;
2. package and install requirement;
3. project inspection instruction;
4. exact selected configuration;
5. integration location and layout constraints;
6. component-specific accessibility and reduced-motion requirements;
7. SSR, pointer, cleanup, and performance requirements when relevant;
8. verification and non-regression criteria.

Only values known from config are stated as facts. Empty project context becomes
an instruction to inspect rather than an invented assumption. Free-form fields
are length-limited, stripped of control characters, visible in the generated
output, and excluded from analytics and share URLs by default.

Prompt templates have snapshot tests and semantic assertions—for example, a
Trail prompt must mention scoped coordinates, reduced motion, pointer-event
pass-through, and bounded nodes; a changed `maxActive` value must appear exactly
once.

## 27. Shareable configurations and URL state

Playground URLs use:

```text
/playground/sticker-trail?v=1&cfg=<base64url-canonical-json>
```

The payload contains component slug, schema version, and allowlisted non-default
values. It is canonicalized by sorted keys, encoded as UTF-8 base64url without
executable code, and capped so the full URL remains under 2KB. Large sticker
arrays, arbitrary data URLs, file contents, and free-form project context are
excluded.

Decoding validates component, version, keys, types, ranges, and length before
state initialization. Unknown keys are ignored; unsupported future versions show
a notice and use safe defaults. A migration table may convert older schemas. The
URL updates with debouncing and `replaceState`; explicit Share creates the
durable copied URL. Back/forward navigation restores configuration.

## 28. Search and syntax highlighting

Search uses Pagefind to generate a static index over built documentation. It
requires no hosted search service in v0.1. Indexed fields include title,
description, headings, component aliases, package names, props, and sticker
tags. Search results are keyboard navigable and work without motion.

Syntax highlighting uses Shiki at build/server time for authored examples. Live
generated code loads Shiki in a dedicated web worker only when the
generated-output panel becomes visible; updates are debounced and stale worker
results are discarded. The primary page bundle and interaction frame remain
independent of highlighting. Plain escaped code is the immediate and failure
fallback.

## 29. SEO and metadata

Next.js metadata defines canonical URLs, titles, descriptions, Open Graph
images, package names, and release status. Component pages include structured
data only where a valid schema applies. Sitemap and robots files are generated
from the registry and content routes.

The important documentation remains present in server-rendered HTML. Interactive
preview failure must not remove API, installation, accessibility, or performance
content from crawlers or users.

## 30. Testing architecture

### 30.1 Unit tests

Vitest covers geometry, velocity smoothing, interpolation, seeded random
selection, pool recycling, value clamping, controlled-state helpers, schemas,
URL codecs, code generators, prompt generators, manifests, and token generation.

Fake timers are used only where they improve deterministic lifecycle tests.
Animation-frame logic uses a controllable frame clock rather than timing real
frames in unit tests.

### 30.2 React component tests

Testing Library covers rendered semantics, ref behavior, controlled/uncontrolled
state, callback count, class and variable contracts, disabled/loading behavior,
cleanup, Strict Mode, and reduced-motion branches.

Tests interact by role and name. Implementation classes are asserted only when
they form a documented styling contract.

### 30.3 Browser interaction tests

Playwright runs real-browser scenarios for:

- Trail distance/velocity behavior, bounds, pause/resume, node ceiling, and
  cleanup;
- Cursor ready/native restoration, hotspot, state changes, editable bypass, and
  leave/blur;
- Navbar desktop/mobile navigation, menu focus, escape, and anchor offset;
- Peel pointer, tap, keyboard, controlled state, cancel, and focus;
- Stack buttons, keyboard, swipe/drag, scroll conflict, loop boundaries, and
  announcements;
- reduced motion, forced colors, coarse-pointer emulation, viewport changes, and
  200% zoom;
- Copy Code, Copy AI Prompt, URL restore, and clipboard fallback.

### 30.4 Visual regression

Playwright screenshot baselines cover paper and night themes, all states,
desktop/tablet/mobile widths, reduced motion resting states, forced colors where
stable, long labels, and representative custom themes. Animations are paused or
driven to deterministic timestamps. Baseline updates require review and a change
explanation.

### 30.5 Performance tests

Dedicated browser scenarios move a pointer continuously through Trail and Cursor
regions for at least 30 seconds. Assertions include:

- active nodes never exceed the configured or hard maximum;
- node count returns to idle baseline;
- no listener or observer accumulation after remount;
- no React render per pointer sample;
- no unbounded timer growth;
- acceptable long-task and frame-time behavior on the CI reference environment;
- no layout shift caused by effect layers.

Performance numbers are recorded as baselines and documented with
hardware/browser context; CI uses regression thresholds rather than an
unsupported universal fps claim.

### 30.6 Accessibility review

Automated axe checks run on every component state and major docs route. Before
beta and stable releases, manual review covers keyboard-only use,
VoiceOver/Safari, NVDA/Firefox or equivalent supported screen-reader pairing,
zoom/reflow, reduced motion, touch, and forced colors.

## 31. Linting and formatting

- ESLint uses TypeScript, React, React Hooks, import, and jsx-a11y rules.
- High-frequency modules have a custom or documented review rule forbidding
  React state setters inside pointer-move handlers.
- Prettier formats code, JSON, YAML, and Markdown.
- Stylelint checks library CSS, custom-property naming, invalid selectors, and
  cascade-layer usage.
- Asset linting is a dedicated script, not an ESLint concern.

Warnings fail CI. Generated files are checked for drift.

## 32. Versioning, npm, and releases

Changesets manages semver, changelogs, and package dependency updates. Release
PRs collect approved changesets. Publishing uses npm trusted publishing/OIDC
with provenance when the selected npm and GitHub setup supports it; long-lived
tokens are a fallback, scoped to release environments and never available to
pull requests.

Before publish:

- clean checkout install;
- lint, typecheck, unit, browser smoke, asset, and build checks;
- package contents inspection with `pnpm pack`;
- fixture installation from tarballs, not workspace links;
- export and type resolution tests;
- license and README presence;
- size-limit check;
- changelog validation.

Canary releases use an explicit prerelease tag. `latest` is updated only from a
protected release workflow after documentation and package checks succeed.

### 32.1 v0.1 alpha public API freeze

Milestone 11 freezes the pre-release package contract before documentation is
built on top of it. The machine-readable freeze artifact is
`tooling/package-preflight/snapshots/public-api.json`. It records the three
package names, every package export path, root runtime symbols, named public
types, the eight component names, wildcard definition/asset policy, and the
explicit standalone Trail boundary. Tarball contents and measured regression
budgets are frozen beside it in `tarball-contents.json` and `size-budgets.json`.

`pnpm test:packages` performs a cache-bypassed clean package build, creates real
tarballs, installs them into isolated Next.js and Vite consumers, and validates
the frozen API, declarations, maps, CSS, dependency closure, licenses, contents,
tree shaking, and size budgets. Snapshot changes are never automatic. A
maintainer reviews the package/API change and runs `pnpm test:packages:update`
only when the new contract is intentional.

After Milestone 11, every public API modification follows this sequence:

```text
authoritative specification update
→ implementation and fixture update
→ Changeset with migration/release intent
→ intentional public API snapshot update
```

An internal refactor that does not alter the public contract does not need an
API snapshot change. Milestone 11 itself does not create a Changeset because it
establishes, rather than changes, the unpublished alpha contract. The package
versions remain `0.0.0` and all three manifests remain `private: true` until
Milestone 18 owns publication infrastructure and release protection changes.

The frozen peer range is React `^19.0.0` and React DOM `^19.0.0` for
`@scout-ui/react`, and React `^19.0.0` for `@scout-ui/sticker-trail`. The packed
Next.js and Vite matrices validate React 19.2.8; no React 18 compatibility is
claimed by this range. The browser policy remains current evergreen Chromium,
Firefox, and Safari as represented by the Playwright Chromium/Firefox/WebKit
projects and the documented capability projects for reduced motion, coarse
pointers, mobile, and forced colors.

## 33. CI/CD

GitHub Actions workflows:

1. **CI:** install with frozen lockfile; lint; format check; typecheck; unit
   tests; build; package checks.
2. **Browser:** Playwright interaction and accessibility matrix; uploaded traces
   only on failure.
3. **Visual:** deterministic screenshot comparison with reviewed artifacts.
4. **Docs preview:** deploy pull-request preview after build; no secrets exposed
   to untrusted code beyond the deployment integration's safe model.
5. **Release:** Changesets release PR and protected npm publish with provenance.
6. **Security:** dependency review for pull requests, scheduled audit, CodeQL
   where applicable, and secret scanning.

Concurrency cancels stale preview and CI runs on the same branch. Release jobs
never run on forked pull-request code.

## 34. Documentation deployment

The docs application is deployment-provider-neutral Next.js, with Vercel as the
recommended initial host because preview deployments and App Router support are
straightforward. Production deploys from protected `main`; pull requests receive
isolated previews.

Environment variables are documented and validated at build time. The site
should not require a database for v0.1. Search index, component registry,
changelog, and examples are build artifacts. A provider change must not affect
published package behavior.

## 35. Security

Primary risks are malicious asset content, unsafe URL configuration, clipboard
assumptions, generated text injection, dependency compromise, and publishing
credentials.

- Pack SVGs reject scripts, event handlers, external resource references,
  foreign objects, and unsafe URLs.
- Remote consumer images render through normal image elements; the library does
  not fetch and inline them.
- Share payloads are size-limited, schema-validated, and never evaluated.
- Generated code and prompts escape strings and remain visible before copy.
- Documentation does not proxy arbitrary remote assets.
- Dependencies are minimized, locked, reviewed, and updated through pull
  requests.
- Release credentials are isolated to protected environments.
- A `SECURITY.md` defines supported versions and private reporting.

## 36. Asset licensing and Scout separation

Every official asset must pass provenance review before merge. The manifest
records creator, source, license, attribution, and checksum. Contributors affirm
that they created the asset or have redistribution rights under the declared
license.

Automated and human review rejects:

- Scout logos, wordmarks, private product screenshots, or product copy;
- existing Scout stickers until individually cleared;
- third-party logos and copyrighted characters;
- close imitation of a reference library's artwork;
- assets without editable source or provenance explanation;
- model-generated artwork whose service terms or source inputs do not support
  redistribution.

Code and artwork licenses remain separate in package and repository
documentation. The v0.1 official generic pack uses CC0 1.0; package code,
scripts, tests, and documentation remain MIT licensed. Provenance and
attribution status remain mandatory manifest fields even though CC0 does not
require attribution.

## 37. Contribution standards

Conventional Commits are recommended for readable history but Changesets, tests,
and clear pull-request descriptions are the release requirements. A component
proposal must include purpose, distinct behavior, accessibility model,
performance implications, design fit, and examples. A new package requires
evidence of independent consumers and cannot be introduced only to create a
shorter import path.

Pull requests include:

- issue or rationale;
- behavior and API summary;
- screenshots or recordings for visual changes;
- keyboard/reduced-motion/touch notes;
- tests;
- changeset for user-visible changes;
- asset provenance when applicable.

## 38. Observability and telemetry boundaries

Published runtime packages contain no analytics, logging endpoints, identifiers,
cookies, storage, or network requests.

The docs may emit anonymous, content-free events such as component page viewed,
preset selected, Copy Code clicked, Copy AI Prompt clicked, and share clicked.
It must never send generated code, generated prompt text, custom asset URLs,
free-form project context, or clipboard contents. Analytics failure cannot
affect functionality.

Development-only warnings cover invalid props, clamped unsafe values, empty
sticker sources, and conflicting controlled state. Warnings are stripped or
silent in production builds where feasible.

## 39. Engineering acceptance criteria for v0.1

The architecture is complete only when:

- the workspace contains one docs app and three public packages;
- package exports work from packed tarballs in Next.js and Vite fixtures;
- `@scout-ui/stickers` contains no React code or React dependency of any kind;
- the React root barrel remains unmarked while each interactive leaf entry
  preserves `"use client"`;
- root and subpath imports pass the RSC boundary and client-bundle fixture
  assertions;
- all eight public APIs are documented and type-tested;
- pointer movement does not cause React renders in Trail or Cursor;
- Trail and Cursor pass sustained movement, cleanup, and node-bound tests;
- Peel and Stack provide keyboard/tap alternatives to drag;
- SSR imports and hydration pass without warnings;
- themes use CSS variables without requiring Tailwind or a provider;
- the sticker manifest and provenance checks pass for every published asset;
- preview, code, prompt, and URL state derive from one schema per component;
- generated code parses and generated prompts contain component-specific safety
  requirements;
- docs search, SEO, accessibility, and responsive layouts pass their matrices;
- Changesets, preview deploys, npm publication, provenance, and changelogs are
  automated;
- runtime packages contain no telemetry.

## 40. Delivery order

Implementation follows dependency order:

1. repository/tooling foundation, consumer test harness, and removal of the
   separate playground app;
2. tokens, CSS layers, and shared types;
3. cleared sticker asset system and manifest tooling;
4. `Sticker`, Button, and Badge foundations;
5. standalone Trail engine and component;
6. Cursor engine;
7. Peel and Stack interaction primitives;
8. Navbar and accessible mobile menu;
9. public package preflight;
10. docs shell and component registry foundation;
11. integrated playground and shareable URL state;
12. code generation and prompt generation;
13. examples, search, SEO, and open-source documentation;
14. accessibility, performance, compatibility, visual regression, CI, packaging,
    and release hardening.

Each milestone must meet its own tests before a dependent milestone begins. The
detailed acceptance criteria and checkpoints live in `IMPLEMENTATION_PLAN.md`.

## 41. Engineering decision summary

Scout UI v0.1 is intentionally small at the package layer and rigorous at the
interaction layer. Three packages provide a broad install, a standalone flagship
install, and framework-neutral artwork. One Next.js app owns both documentation
and playground behavior. CSS variables and scoped styles preserve portability.
Pointer and drag engines operate through refs, fixed pools, Pointer Events, and
animation frames rather than per-movement React state. A single typed schema
drives previews, generated code, generated AI prompts, and share URLs.
Packaging, accessibility, asset provenance, performance, and release automation
are part of the first usable release rather than post-launch cleanup.
