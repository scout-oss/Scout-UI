# Scout UI v0.1 Implementation Plan

**Status:** Milestones 1–7 complete; Milestone 8 has not started<br /> **Source
documents:** `SCOUT_UI_MASTER_SPEC.md`, `SCOUT_UI_DESIGN_SYSTEM.md`,
`SCOUT_UI_ENGINEERING_SPEC.md`<br /> **Scope:** Eight components, three public
packages, one documentation/playground application

## 1. Execution rules

1. The three specifications are the source of truth. Any change to component
   count, package count, public API, visual language, accessibility policy, or
   performance model must update the relevant specification before
   implementation continues.
2. `../scout-in` remains read-only reference material. No Scout product code or
   assets are modified or copied without a separate explicit instruction and
   provenance review.
3. Milestones are dependency-ordered. A milestone exits only when its acceptance
   criteria pass; later work must not conceal an unstable foundation.
4. No new public package is added in v0.1. Shared internals remain private.
5. No component is considered complete without documentation, accessibility
   behavior, reduced-motion behavior, touch policy, tests, and packed-package
   verification.
6. High-frequency components never update React state for every pointer
   movement.
7. Official artwork is published only after license and provenance checks pass.
8. Copy Code and Copy AI Prompt are generated locally from the same
   configuration schema as the preview.

## 2. Milestone dependency map

```text
Repository foundation
  ├── Tokens and CSS foundation
  ├── Test/consumer harness
  └── Asset pipeline
          ↓
Sticker + Button + Badge
          ↓
Trail → Cursor
          ↓
Peel → Stack
          ↓
Navbar
          ↓
Package preflight
          ↓
Docs foundation → Registry/playground → Codegen → Promptgen
          ↓
Examples/search/SEO/content
          ↓
Accessibility + performance hardening
          ↓
Full test matrix + CI/release
          ↓
Final QA and v0.1 release candidate
```

Asset creation can run alongside early component work after the asset-license
decision, but published examples cannot depend on uncleared artwork.

## 3. Milestone 1 — Repository and tooling foundation

**Status:** Complete (2026-08-11)

### Work

- Remove the unused `apps/playground` scaffold and keep playground routes in
  `apps/docs`.
- Create the target workspace folders for docs, packages, fixtures, and tooling.
- Pin the supported Node and pnpm versions.
- Configure pnpm workspaces, Turborepo, strict TypeScript project references,
  ESLint, Stylelint, Prettier, Vitest, and base Playwright configuration.
- Establish root scripts from the engineering specification.
- Add Changesets configuration without publishing.
- Add repository policies: contribution guide, code of conduct, security policy,
  support policy, pull-request template, and issue forms.
- Add license separation for code and assets.

### Acceptance criteria

- A clean install succeeds with a frozen lockfile.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` run from the
  root, even if early workspaces contain only minimal build entries.
- Turborepo correctly caches deterministic tasks and does not cache persistent
  development or browser tasks.
- `apps/playground` no longer exists and no configuration references it.
- The workspace contains exactly three public package manifests and all remain
  unpublished/private until release setup.
- `git diff --check` and formatting checks pass.
- No file in `../scout-in` changes.

## 4. Milestone 2 — Consumer fixtures and test harness

**Status:** Complete (2026-08-11)

### Work

- Create private Next.js App Router and Vite React fixtures.
- Add Next.js RSC routes covering server-compatible root/subpath imports, direct
  serializable client entries, and user-authored client wrappers for callback
  props.
- Add a package-tarball install test rather than relying only on workspace
  links.
- Configure browser projects for Chromium, Firefox, WebKit, reduced motion,
  coarse pointer, desktop, tablet, and mobile.
- Add deterministic screenshot utilities, a controllable animation-frame clock
  for unit tests, and axe integration.
- Add test-only pages that isolate pointer and drag components from docs
  styling.

### Acceptance criteria

- Both fixtures build and render a trivial import from a packed local package.
- The React root barrel is emitted without `"use client"`; interactive leaf
  entries retain it; server-compatible leaf entries remain unmarked.
- Server-compatible root and subpath imports render in an App Router Server
  Component without becoming client boundaries.
- Direct client-entry imports with serializable props and client-wrapper usage
  with callbacks both build and hydrate correctly.
- Importing only `Sticker` does not pull Trail, Cursor, Navbar, Peel, or Stack
  into the client chunk.
- ESM exports, declaration files, source maps, and stylesheet exports resolve
  correctly.
- Browser tests can set reduced motion, viewport, touch/coarse pointer, and
  forced-colors conditions where supported.
- Screenshot tests run with animations at deterministic resting states.
- Test harness failures produce useful traces or screenshots without uploading
  artifacts on success.

## 5. Milestone 3 — Design tokens and CSS foundation

**Status:** Complete (2026-08-11)

### Work

- Implement the paper/night foundations, accent and semantic colors, typography
  variables, spacing, outlines, cut lines, radii, shadows, motion, intensity,
  and layer tokens.
- Create CSS cascade layers and collision-resistant `sui-` component naming.
- Generate typed token metadata for docs from the CSS source of truth.
- Implement paper and night test canvases plus forced-colors and reduced-motion
  baselines.
- Add consumer theming examples using plain CSS variables; do not add a Tailwind
  dependency.

### Acceptance criteria

- Token metadata and CSS cannot drift without a failed check.
- Light and dark combinations meet the specified contrast rules.
- Focus tokens remain visible against paper, night, ultraviolet, acid, cyan, and
  custom-themed surfaces.
- Changing theme variables affects components without a React provider.
- No global reset or element styling leaks into a fixture application.
- Forced-colors mode retains functional outlines and focus even when custom
  shadows disappear.

## 6. Milestone 4 — Sticker asset system and first pack

**Status:** Complete (2026-08-11)

### Prerequisite decision

The official generic artwork license is CC0 1.0. Code remains MIT; artwork and
code licenses are recorded separately, and provenance remains mandatory even
though attribution is not required.

### Work

- Define the `StickerDefinition` schema and generated manifest.
- Implement asset validation for IDs, dimensions, transparent bounds, file size,
  SVG safety, references, trademarks, license fields, attribution, and
  checksums.
- Configure deterministic SVG optimization and raster optimization.
- Produce or commission 24–36 original cleared assets across signal, expression,
  direction, object, and label families.
- Add `ATTRIBUTION.md`, `LICENSE-ASSETS.md`, editable-source policy, and
  contribution checklist.
- Implement root definitions plus explicit asset subpath exports.
- Freeze the accepted 25-sticker SVG pack for the remaining v0.1 milestones;
  richer photographic and material families are separate post-Milestone-19 work.

### Acceptance criteria

- At least 24 assets pass automated and human art-direction review.
- Every asset has creator/source, license, attribution status, checksum,
  dimensions, category, tags, and editable-source record.
- No Scout logo, product screenshot, product claim, protected sticker,
  third-party logo, or copyrighted character is present.
- Unsafe SVG constructs and external references fail the build.
- Root imports do not inline the entire pack into consumer JavaScript.
- The package contains no React/JSX source and no React or React DOM dependency,
  peer dependency, optional dependency, or React-specific export.
- `new URL(..., import.meta.url)` definitions and direct asset imports work from
  packed tarballs in both fixtures.
- The pack reads as one family at normal and small optical sizes.

## 7. Milestone 5 — Shared primitives: Sticker, StickerButton, StickerBadge

**Status:** Complete (2026-08-11)

### Work

- Implement the discriminated public APIs exactly as specified.
- Implement cut line, outline, material, shadow, tone, size, rotation,
  intensity, loading, selected, static, remove, button, and anchor branches.
- Preserve authored cut lines, ink outlines, and transparent padding on official
  `StickerDefinition` sources; source artwork receives no second wrapper outline
  by default, while raw consumer artwork can opt into wrapper treatment.
- Keep source rendering format-agnostic for SVG, PNG, WebP, photographic, and
  future material artwork without adding assets or changing the public API.
- Implement semantic focus, disabled, loading, selected, and remove behavior.
- Add CSS-variable customization and paper/night examples.
- Add long-label, custom-font, custom-theme, zoom, and forced-colors coverage.

### Acceptance criteria

- Static, button, anchor, select, and remove modes render the correct native
  element and accessible state.
- The type system rejects invalid combinations such as anchor loading or nested
  interactive remove behavior.
- Interactive targets meet size guidance and focus remains visible outside hard
  shadows.
- Reduced motion preserves color, outline, and shadow feedback without
  translation.
- Components work with no theme provider or Tailwind setup.
- Unit, component, accessibility, and visual tests pass.
- Packed package imports work in both fixtures.

## 8. Milestone 6 — StickerTrail standalone package

**Status:** Complete (2026-08-13)

### Work

- Implement geometry, velocity smoothing, interpolation, seeded source
  selection, presets, and value clamping as pure modules.
- Implement the fixed node pool and imperative frame engine.
- Implement wrapper component and lower-level hook.
- Implement container-local coordinates, geometry invalidation, visibility
  pause, document visibility handling, cleanup, clipping, and tap mode.
- Add all presets: calm, scout, dense, floaty, and chaos.
- Re-export Trail through `@scout-ui/react` and include its CSS in the broad
  stylesheet build.

### Acceptance criteria

- Pointer movement does not trigger a React render or state update.
- Active nodes never exceed configured and hard ceilings.
- A long pointer jump or background-tab return does not backfill unbounded
  nodes.
- Coordinate behavior remains correct in a positioned, scrolled, padded, and
  resized container.
- Trail nodes use `pointer-events: none` and never block text selection or
  controls.
- Offscreen, reduced-motion, disabled, and coarse-pointer states run no movement
  loop.
- Tap mode does not interfere with scrolling or cancelled gestures.
- Repeated Strict Mode mount/unmount leaves no listener, observer, frame,
  animation, or node leak.
- Thirty seconds of sustained movement stays within the recorded frame-time and
  long-task regression budget.
- Standalone and broad-package installation examples work from tarballs.

## 9. Milestone 7 — StickerCursor

### Work

- Implement the single-node position and velocity-settle engine plus optional
  four-node echo pool.
- Decode assets before hiding the native cursor.
- Implement default, hover, active, custom data-attribute, native bypass,
  editable, media, leave, blur, error, and unmount states.
- Implement hotspot preview and validation.
- Add fine-pointer, hover-capability, reduced-motion, and coarse-pointer
  policies.

### Acceptance criteria

- Pointer movement does not trigger React rendering.
- The native cursor remains visible until the custom asset is ready.
- Native behavior returns immediately over editable/native regions and after
  leave, blur, error, capability change, and unmount.
- Custom visuals never intercept pointer events or replace focus indicators.
- Tilt and settle stay within design limits and stop scheduling frames at rest.
- Cursor state changes do not shift the hotspot unexpectedly.
- Sustained movement and repeated remount tests show no unbounded work or
  cleanup leak.
- Mobile/coarse-pointer and reduced-motion environments receive the native
  cursor only.

## 10. Milestone 8 — StickerPeel

### Work

- Implement controlled/uncontrolled open state and four corner origins.
- Implement semantic toggle, tap, keyboard, and optional pointer-drag
  enhancement.
- Implement frame-coalesced drag progress through CSS variables.
- Manage front/back focusability with inertness and visibility rules.
- Implement reduced-motion crossfade/immediate state and stable loading behavior
  for back content.

### Acceptance criteria

- Enter, Space, click, and tap can open and close without drag.
- Escape behavior and focus remain predictable for disclosure use.
- Pointer cancel returns to the prior semantic state.
- Drag never suppresses page scrolling before directional intent is established.
- Only the visible layer is interactive and exposed as active content.
- Controlled and uncontrolled modes fire callbacks exactly once per committed
  change.
- Reduced motion has no curl travel.
- Zoom, reflow, long content, all four origins, mobile, and forced-colors tests
  pass.

## 11. Milestone 9 — StickerStack

### Work

- Implement generic item typing, stable keys, controlled/uncontrolled index, 2–5
  visible layers, loop boundaries, next/previous controls, and empty state.
- Implement deterministic offsets and rotations.
- Add optional axis-locked drag/swipe using refs and CSS variables.
- Implement transition gating, live position announcement, inert background
  cards, reduced motion, and item-count normalization.

### Acceptance criteria

- Only visible layers render, with at most one outgoing layer during transition.
- Only the active card is interactive and exposed to assistive technology.
- Buttons always provide a complete non-drag interaction path.
- Arrow-key behavior, if enabled, matches documentation and does not trap focus.
- Swipe intent does not steal perpendicular page scrolling.
- Rapid navigation does not corrupt order or emit duplicate callbacks.
- Item removal, empty state, loop and non-loop boundaries, controlled state, and
  reduced motion pass tests.
- Mobile shows one readable active card plus bounded depth hints.

## 12. Milestone 10 — StickerNavbar

### Work

- Implement semantic header/nav, ribbon and collage variants, active state,
  brand/switch/action slots, sticky mode, and optional scroll progress.
- Implement static SVG ribbon and clip-path reveal; no path morphing.
- Implement collage decoration as an isolated accessible-hidden layer.
- Implement mobile menu with Radix Dialog, return focus, Escape, outside
  interaction, and route-close behavior.
- Implement `renderLink` adapter for framework routers and default anchor
  behavior.
- Add anchor scroll-margin integration and responsive variants.

### Acceptance criteria

- Ribbon never intersects functional labels in supported layouts and renders
  immediately under reduced motion.
- Collage never reduces link or action contrast below requirements.
- Links remain anchors; the custom renderer ultimately produces an accessible
  anchor.
- Desktop, tablet, mobile, very small mobile, long labels, custom brand, and
  custom primary action pass visual tests.
- Mobile menu traps and returns focus correctly, closes on Escape and
  navigation, and exposes current page.
- Sticky navigation does not obscure anchor targets.
- Scroll progress is compositor-friendly, optional, and hidden from assistive
  technology.

## 13. Milestone 11 — Public package preflight

### Work

- Finalize the unmarked root barrel, all eight explicit component subpaths,
  declaration output, source maps, CSS inclusion, README install instructions,
  side-effect flags, and peer dependency ranges.
- Verify the root React package re-exports Trail without flattening client
  modules, bundling React, or depending on the official sticker pack.
- Inspect emitted modules to enforce the server/client boundary table from the
  Engineering Spec.
- Add package-size budgets and tarball-content snapshots.
- Freeze v0.1 alpha APIs after review of real fixture integrations.

### Acceptance criteria

- Every export resolves under TypeScript and runtime conditions from tarballs.
- No package includes repository-only tests, masters, secrets, or unrelated
  assets.
- React and React DOM are peers and absent from bundles.
- `@scout-ui/stickers` is React-free in source, manifest, exports, and tarball
  contents.
- The root barrel has no client directive; only Trail, Cursor, Navbar, Peel, and
  Stack leaf entries have one.
- Root and subpath imports pass the Next.js RSC fixture, serialization cases,
  bundle-boundary assertions, and hydration checks.
- Broad React CSS includes Trail CSS once; standalone Trail CSS works
  independently.
- Tree-shaking removes unused components in the Vite fixture.
- Next.js builds with preserved leaf directives, server-compatible static
  primitives, and no hydration warnings.
- Package-size checks have documented baselines.
- API changes after this milestone require a specification update and Changeset.

## 14. Milestone 12 — Documentation application foundation

### Work

- Build the Next.js App Router shell, paper/night themes, responsive grid,
  global navigation, search trigger, mobile menu, footer, route focus
  management, and reduced-effects preference.
- Establish MDX content loading and typed component registry.
- Implement component-page skeleton, preview boundary, error boundary,
  fixed-size hydration poster, code block system, and
  page-edge/table-of-contents navigation.
- Create real routes for Home, Components, Stickers, Playground, Examples,
  Guides, Changelog, and GitHub/open-source.

### Acceptance criteria

- All major routes render meaningful server HTML and canonical metadata.
- Navigation, search trigger, mobile menu, route focus, skip link, headings, and
  table of contents are keyboard accessible.
- Client-only preview hydration does not shift surrounding content.
- Preview failure leaves install, API, accessibility, performance, and source
  content available.
- Desktop, tablet, mobile, 320px reflow, 200% zoom, paper/night, and
  reduced-effects layouts pass baseline review.
- The site uses Scout UI structure rather than a generic documentation
  sidebar/card template.

## 15. Milestone 13 — Registry, playground, and shareable URL state

### Work

- Define one typed `ComponentDocDefinition` for each of the eight components.
- Implement schemas for content, appearance, motion, behavior, and accessibility
  controls.
- Implement validation, normalization, dependent fields, presets, reset,
  configuration dirty state, and safe control rendering.
- Implement versioned canonical JSON/base64url codec, migration table, 2KB URL
  cap, history behavior, and Share action.
- Implement desktop control rail and tablet/mobile bottom-sheet behavior.

### Acceptance criteria

- Every component page and full playground route reads from the same registry
  definition.
- Control changes update preview state without remounting unrelated page
  sections.
- Invalid, unknown, oversized, and future-version URL payloads fail safely to
  defaults with a notice.
- Only allowlisted non-default values are serialized; free-form project context
  and arbitrary data URLs are excluded.
- Back/forward restores configuration and Reset restores canonical defaults.
- Share URLs reproduce the same configuration in a new session.
- Controls remain keyboard accessible and usable on mobile.

## 16. Milestone 14 — Copy Code

### Work

- Implement deterministic code generators for all eight components.
- Emit stable imports, style import, non-default props, bundled asset IDs or
  explicit placeholders, and complete examples.
- Add visible generated output, worker-isolated highlighting, copy, fallback
  selection, success announcement, and changed-value emphasis.
- Add TypeScript parse/compile tests and generator snapshots.

### Acceptance criteria

- Every default and preset generates valid parseable TypeScript/JSX.
- Generated examples import only public package exports.
- Non-default props appear once in stable schema order.
- Strings and asset identifiers are escaped safely.
- Code remains visible before copying and plain text appears immediately before
  highlighting finishes.
- Clipboard failure exposes a reliable manual path.
- Copy content is never sent to analytics.
- Generated examples compile in at least one fixture-backed matrix per
  component.

## 17. Milestone 15 — Copy AI Prompt

### Work

- Implement ordered local prompt templates and concise/detailed modes.
- Add framework, target location, asset strategy, preserve-layout, and safe
  free-form context fields.
- Add component-specific accessibility, motion, SSR, pointer, cleanup, and
  verification sections.
- Synchronize prompt output with configuration changes and add visible
  configuration summary.
- Implement desktop sheet/dialog and mobile full-height sheet with focus
  management and return focus.

### Acceptance criteria

- Every component produces a useful prompt from default configuration.
- Every non-default configuration value that changes implementation appears
  correctly and exactly once.
- Trail prompts mention scoped coordinates, pointer pass-through, bounded nodes,
  cleanup, and reduced motion.
- Cursor prompts mention native restoration, editable bypass, coarse pointers,
  and no per-move React state.
- Peel and Stack prompts require keyboard/tap alternatives to drag.
- Unknown project facts are framed as inspection instructions, never assertions.
- Free-form fields are length-limited, escaped, visible, and excluded from share
  URLs and analytics.
- The UI states that generation is local and sends no repository data.
- Snapshot and semantic prompt tests pass for every component and preset.

## 18. Milestone 16 — Complete documentation, examples, search, and SEO

### Work

- Write installation, theming, asset authoring, SSR/Next.js, motion,
  accessibility, performance, AI handoff, contribution, and migration guides.
- Build component index, eight component reference pages, pack browser, full
  playgrounds, examples, changelog, and open-source pages.
- Implement the homepage sequence from the design system.
- Add the six scoped examples using public package imports.
- Generate Pagefind search, sitemap, robots, canonical metadata, and social
  images.

### Acceptance criteria

- Every component page contains preview, controls, install, code, prompt, API,
  examples, accessibility, performance, touch, reduced motion, SSR, and source
  sections.
- Examples build against packed/public exports and demonstrate restraint with
  ordinary interface content.
- Search returns components by name, aliases, package, props, guide terms, and
  sticker tags; it is fully keyboard usable.
- All indexable pages have unique titles/descriptions, canonical URLs, and
  stable headings.
- The homepage demonstrates Trail, Cursor, Navbar, Peel, and Stack without
  running more than one loud effect in a viewport.
- Sticker pages expose license and provenance clearly.
- No protected Scout asset or product claim appears in a distributed package or
  generic example.

## 19. Milestone 17 — Accessibility and performance hardening

### Work

- Run automated accessibility checks on every state and route.
- Complete manual keyboard, screen-reader, touch, zoom/reflow, forced-colors,
  and reduced-motion reviews.
- Profile sustained Trail/Cursor movement and Peel/Stack drag on the reference
  matrix.
- Verify offscreen pause, visibility reset, node limits, layout stability,
  memory cleanup, and docs bundle behavior.
- Fix high-confidence failures; record intentional trade-offs and limits in
  docs.

### Acceptance criteria

- No known critical or serious accessibility violation remains.
- All drag interactions have complete keyboard and tap/button alternatives.
- Focus remains visible under overlap, hard shadows, paper/night themes, forced
  colors, and 200% zoom.
- Documentation reflows at 320 CSS pixels without two-dimensional page
  scrolling.
- Performance baselines and regression thresholds are recorded with environment
  context.
- Sustained pointer tests produce bounded nodes, no listener/observer/timer
  growth, and no per-move React render.
- Offscreen and reduced-motion demos stop unnecessary work.
- Package and docs bundle budgets pass or have an approved documented exception.

## 20. Milestone 18 — CI, publication, and release infrastructure

### Work

- Implement GitHub Actions for CI, browser tests, visual tests, dependency
  review, security analysis, preview deploys, Changesets, and protected release.
- Configure npm trusted publishing/provenance or the narrow documented fallback.
- Configure documentation preview and production deployment.
- Add prerelease/canary flow, release notes, changelog validation, package
  tarball inspection, and rollback procedure.
- Check npm package-name and namespace availability immediately before
  publication.

### Acceptance criteria

- Pull requests run frozen-install, formatting, lint, types, unit, build,
  package, browser, accessibility, and required visual checks.
- Forked pull requests receive no release credential.
- Packed tarballs are installed into both fixtures before release.
- Preview deployments are isolated and production deploys require protected-main
  success.
- A dry-run release produces correct versions, changelogs, dependency ranges,
  provenance configuration, and package contents without publishing `latest`.
- A canary release can be installed by public package name and the docs can
  target it.
- Rollback and deprecation steps are documented.

## 21. Milestone 19 — Final QA and v0.1 release candidate

### Work

- Run the complete matrix from a clean checkout with caches disabled.
- Review all public APIs, docs examples, presets, asset licenses, package
  contents, changelog, and support policy.
- Perform a production-like docs preview review on desktop and mobile.
- Trial at least one package in a separate consumer fixture that resembles
  Scout's environment.
- Prepare the release candidate and migration notes from any alpha API changes.

### Acceptance criteria

- All eight components satisfy the master quality contract.
- All three packages install independently according to their documented
  purpose.
- The official pack contains at least 24 cleared coherent assets.
- Documentation, integrated playground, Copy Code, Copy AI Prompt, share URLs,
  search, examples, and source links work.
- No critical accessibility, security, SSR, hydration, memory, cleanup, or
  package-resolution defect remains.
- Known limitations are explicit and do not contradict marketing claims.
- Runtime packages contain no telemetry or network calls.
- Release candidate package size and performance baselines are published.
- Maintainers explicitly approve promotion to v0.1.

## 22. Post-v0.1 Scout adoption checkpoint

Scout adoption is a separate task and is not authorized by this plan. After the
public package is stable:

1. compare the public component against Scout's internal interaction;
2. identify any product-specific differences;
3. run Scout's existing behavior, analytics, backend, and destination tests;
4. request explicit approval before changing `../scout-in`;
5. migrate one low-risk consumer first;
6. verify no protected Scout asset was accidentally moved into the public
   package.

## 23. Required decision checkpoints

### Before publishable artwork

- Selected: CC0 1.0 for official generic artwork; MIT for code and tooling.
- Approved: provenance and contributor affirmation language in
  `packages/stickers/CONTRIBUTING_ASSETS.md`.

### Before alpha API freeze

- Review fixture integrations for all eight APIs.
- Confirm React peer range and browser support matrix.
- Confirm Radix Dialog bundle cost for Navbar.

### Before external services

- Choose GitHub organization/repository destination.
- Confirm npm scope ownership and package-name availability.
- Confirm documentation host and deployment project.
- Confirm whether privacy-respecting docs analytics will be enabled; default is
  none.

### Before v0.1 promotion

- Approve visual-regression changes.
- Approve asset and license manifest.
- Approve known limitations and support policy.
- Approve release notes and public positioning.

## 24. Scope controls

The following requests require a specification change and do not enter v0.1
opportunistically:

- a ninth component;
- a fourth public package;
- a separate playground application;
- CommonJS builds;
- non-React framework ports;
- hosted AI generation or repository scanning;
- community asset uploads;
- a public motion/core/tokens API;
- site-wide custom cursor defaults;
- publication of existing Scout assets without individual clearance.

## 25. Definition of done

Scout UI v0.1 is done when it is independently installable, visually
recognizable, accessible, performance-bounded, documented, testable from packed
artifacts, safely releasable, and useful with both official and
consumer-supplied stickers. Catalogue size, animation volume, and documentation
spectacle are not completion measures.
