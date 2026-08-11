# Scout UI Design System Specification

**Status:** Source of truth for visual, interaction, and documentation
design<br /> **Depends on:** `SCOUT_UI_MASTER_SPEC.md`<br /> **Design
principle:** Controlled chaos<br /> **Product line:** Scout UI — The open-source
sticker UI library<br /> **Tagline:** UI that sticks.

## 1. Design north star

Scout UI should feel like a meticulously art-directed sticker book brought to
life in a browser. It is tactile, bold, youthful, slightly imperfect, and highly
responsive to input. It is not childish, random, nostalgic for its own sake, or
visually noisy everywhere.

The system's defining tension is:

- **stable structure:** clear reading order, editorial grids, calm content
  fields, predictable navigation, strong contrast; and
- **expressive interruption:** cutout stickers, offset depth, hand-drawn paths,
  overlap, rotation, texture, and springy feedback.

Controlled chaos means the expressive layer may break a grid visually but never
semantically. Headings remain readable. Controls retain predictable hit areas.
Focus order follows the document. Important content never depends on a sticker
effect being visible.

## 2. Relationship to Scout

Scout UI generalizes the strongest qualities visible in the Scout product:

- off-white paper and near-black night worlds;
- ultraviolet, lime, cyan, pink, cobalt, and orange accents;
- very large editorial display type paired with restrained body copy;
- highlighted headline fragments that resemble applied labels;
- white sticker cut lines, dark ink outlines, and offset shadows;
- cutout illustration mixing flat vector forms with occasional photographic
  objects;
- ribbon or collage navigation treatments;
- deliberate overlap and slightly rotated device or content compositions;
- motion based on lift, press, settle, reveal, and trail rather than glossy
  ambient effects;
- responsive simplification that preserves hierarchy and character.

Scout UI must not reuse Scout's logo, product screenshots, product copy, navbar
collage, or named stickers without explicit clearance. The library's default art
is original, product-agnostic, and independently licensed.

## 3. Core visual principles

### 3.1 One anchor, one interruption

Every viewport should have a clear anchor: a headline, preview, active
component, or primary action. Sticker energy supports or interrupts that anchor;
it does not create several competing anchors. A section may contain many
stickers only when one composition owns the energy.

### 3.2 Read first, discover second

The first scan reveals what the page is and what to do. The second scan reveals
peel edges, handwritten notes, hover reactions, and visual jokes. Discovery
rewards attention without hiding basic operation.

### 3.3 Contrast over softness

Scout UI prefers crisp paper/ink contrast, saturated accents, and decisive
edges. It avoids translucent glass cards, pastel-only palettes, large blurred
gradients, and stacks of indistinguishable rounded rectangles.

### 3.4 Imperfection is bounded

Rotations, offsets, and irregular edges use small defined ranges. Body copy and
form controls remain level. Random-looking placement is authored or seedable.
Misalignment must read as intentional at every breakpoint.

### 3.5 Texture is evidence of material

Paper grain, ink noise, halftone, photocopy marks, and metallic reflections
imply a physical material. Texture is subtle, nonessential, and never reduces
text contrast. No texture should cover an entire reading surface at more than 6%
effective opacity.

### 3.6 Energy has a budget

Only one loud motion may dominate a viewport. A pointer trail, peel, draggable
stack, and moving marquee should not all run together. The documentation
playground pauses surrounding decorative motion while a component is being
tested.

## 4. Intensity and density

Scout UI exposes an `intensity` language that applies consistently across themes
and components.

| Level     | Rotation | Overlap | Shadow offset | Motion amplitude | Recommended use                |
| --------- | -------: | ------: | ------------: | ---------------: | ------------------------------ |
| `calm`    |     0–2° |    0–6% |         3–5px |             0.6× | product surfaces, long reading |
| `playful` |     0–5° |   4–14% |         5–8px |               1× | default, marketing, onboarding |
| `loud`    |     0–9° |   8–22% |        7–12px |            1.25× | bounded hero or event moment   |

`loud` never increases active DOM limits, duration of blocking motion, or
pointer capture. Density is separate from intensity:

- `sparse`: one expressive object per major region;
- `balanced`: one primary cluster plus one or two small annotations;
- `packed`: a bounded collage used only in a hero, pack browser, or dedicated
  canvas.

Reading pages default to `calm` or `playful` and `sparse`. The docs homepage may
use `loud` and `packed` in its hero, then alternate with quiet sections.

## 5. Color system

### 5.1 Foundations

| Token                | Value     | Use                                  |
| -------------------- | --------- | ------------------------------------ |
| `--sui-paper`        | `#F7F5EF` | primary light background             |
| `--sui-paper-raised` | `#FFFEFA` | cards and cutout interiors           |
| `--sui-paper-muted`  | `#EDE9DF` | secondary paper layer                |
| `--sui-ink`          | `#121116` | primary text, outlines, hard shadows |
| `--sui-ink-muted`    | `#625E68` | body and metadata on light surfaces  |
| `--sui-night`        | `#0B0A0E` | primary dark background              |
| `--sui-night-raised` | `#17131B` | dark raised surface                  |
| `--sui-night-line`   | `#312B36` | dark separators                      |
| `--sui-night-text`   | `#F5F1F7` | primary dark-mode text               |
| `--sui-night-muted`  | `#ABA3B0` | body copy on dark surfaces           |

### 5.2 Accents

| Token               | Value     | Character                             |
| ------------------- | --------- | ------------------------------------- |
| `--sui-ultraviolet` | `#7C2CFF` | signature action and creative energy  |
| `--sui-acid`        | `#D4FF5F` | highlight, success-adjacent optimism  |
| `--sui-cyan`        | `#61DBE8` | focus, information, electric contrast |
| `--sui-hot-pink`    | `#FF3D9A` | expressive emphasis and reactions     |
| `--sui-cobalt`      | `#1664FF` | graphic object and directional accent |
| `--sui-orange`      | `#FF7A1A` | warmth, urgency, secondary emphasis   |

### 5.3 Semantic roles

- success: `#2E8B57` on paper or acid with ink for large surfaces;
- warning: `#FFB020` with ink;
- danger: `#D9364B` with white or paper according to contrast;
- information: cobalt or cyan with ink/night pairing;
- focus: cyan on dark surfaces, ultraviolet with a paper separation ring on
  light surfaces;
- disabled: reduced saturation plus explicit opacity and cursor treatment, never
  opacity alone.

### 5.4 Pairing rules

- Ink text may sit on paper, acid, cyan, and light orange.
- White text may sit on ultraviolet, cobalt, dark pink, and ink/night.
- Acid text on white and cyan text on white are prohibited.
- Thin body text never uses a saturated accent.
- Large sticker clusters use at most three accents plus foundations in one
  composition.
- A component may inherit a custom accent, but its focus and semantic colors
  remain independently configurable.

The documentation site supports paper and night sections within one page rather
than treating them as complete light and dark mode duplicates. Consumer themes
may remap tokens.

## 6. Typography

### 6.1 Families

The documentation identity uses:

- **Display:** Bricolage Grotesque, 600–800;
- **Body and UI:** Inter, 400–700;
- **Code:** Geist Mono, ui-monospace fallback.

Packages do not download or force fonts. They use `--sui-font-display`,
`--sui-font-body`, and `--sui-font-mono`, defaulting to an inherited system-safe
stack. The docs self-host licensed font files where permitted.

### 6.2 Scale

| Role       | Desktop                        | Mobile                        | Line height | Tracking   |
| ---------- | ------------------------------ | ----------------------------- | ----------- | ---------- |
| Display XL | `clamp(4.8rem, 8vw, 8rem)`     | `clamp(3.2rem, 16vw, 4.8rem)` | 0.82–0.9    | `-0.055em` |
| Display L  | `clamp(3.4rem, 5.8vw, 5.8rem)` | `clamp(2.7rem, 13vw, 4rem)`   | 0.9–0.98    | `-0.045em` |
| Heading M  | `clamp(2.2rem, 3.5vw, 3.6rem)` | `2.1–2.8rem`                  | 1.0         | `-0.035em` |
| Heading S  | `1.35–1.75rem`                 | `1.25–1.5rem`                 | 1.1         | `-0.025em` |
| Body L     | `1.05–1.2rem`                  | `1rem`                        | 1.6–1.75    | 0          |
| Body       | `0.94–1rem`                    | `0.94–1rem`                   | 1.55–1.7    | 0          |
| Label      | `0.72–0.82rem`                 | `0.7–0.8rem`                  | 1.2         | `0.04em`   |
| Eyebrow    | `0.65–0.75rem`                 | `0.62–0.7rem`                 | 1.2         | `0.12em`   |

Display type may be tightly stacked and highlighted with an applied label. Body
text remains level, sentence case, and no wider than 68 characters. All-caps is
reserved for short eyebrows, stamps, and tiny navigation annotations.

## 7. Spacing and layout

### 7.1 Spacing scale

The base unit is 4px. Core steps are 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80,
96, 128, and 160px.

- control internal gaps: 8–12px;
- card padding: 20–32px mobile, 28–48px desktop;
- reading section vertical padding: 80–96px mobile, 112–144px desktop;
- high-energy hero padding: 56–80px mobile, 88–128px desktop;
- overlap must not reduce the underlying content's usable padding.

### 7.2 Grid

- maximum content width: 1240px;
- readable content width: 680–760px;
- desktop: 12 columns, 24px gutters;
- tablet: 8 columns, 20px gutters;
- mobile: 4 columns, 16px gutters;
- page edge: 20px minimum mobile, 24–32px tablet, 40–64px desktop.

Primary breakpoints are 480, 768, 1024, and 1280px. Components use container
queries where their behavior depends on local width. Media queries remain for
viewport-level navigation and pointer capability.

Visual objects may cross columns, but text and controls align to grid anchors.
On mobile, overlap is reduced before objects are scaled below useful size.

## 8. Shape, outline, and material

### 8.1 Shape families

- **cutout:** irregular silhouette following the artwork;
- **label:** small asymmetric rectangle or capsule with a slight rotation;
- **paper:** rectangular content surface with 12–24px corners and optional
  clipped corner;
- **stamp:** compact circle, oval, burst, or notched seal;
- **ribbon:** continuous path with rounded joins;
- **pill:** reserved for short binary or category controls, not general
  containers.

### 8.2 Sticker cut line

The standard cut line is an outer paper-colored stroke equal to 5–8% of the
sticker's shorter dimension, clamped to 3–10px. A 1.5–3px ink outline may sit
inside the cut line. Small assets simplify to one outline. Cut lines must remain
optically consistent, not numerically identical across all source sizes.

### 8.3 Borders

- strong component border: 2px ink;
- compact border: 1.5px ink;
- dark-surface separator: 1px night line;
- dashed and scribbled borders are decorative and cannot define a critical hit
  target.

### 8.4 Radii

Radii are deliberately mixed by material: 8px label, 14px control, 20px paper,
28px large board, and 999px only for true pills. A page should not render every
container as a 24px rounded card.

### 8.5 Shadows

Scout UI uses two distinct depths:

- **stuck:** hard offset shadow, e.g. `6px 6px 0 var(--sui-ink)`;
- **lifted:** the hard offset plus a soft ambient shadow, e.g.
  `0 18px 42px rgb(18 17 22 / 18%)`.

Hover normally increases lift by 2px; active state collapses toward the hard
shadow plane. Dark themes may use accent-colored hard shadows where an ink
shadow would disappear. Blur-only floating cards are not part of the core
identity.

## 9. Texture, illustration, and iconography

### 9.1 Sticker artwork

The official pack combines two compatible modes:

- bold flat vector artwork with black outlines, white cut lines, compressed
  shapes, and 2–4 saturated colors;
- selectively used photographic or material cutouts with an obvious paper edge
  and one color-treated detail.

One pack should not mix unrelated rendering styles indiscriminately. A
photographic object must be art-directed to the same palette and outline system
as the vector assets.

### 9.2 Doodles

Doodles use a 2–4px rounded stroke with visible but bounded wobble. Arrows
should point to real content. Scribbles may underline, connect, encircle, or
annotate; they do not sit behind body text.

### 9.3 Icons

Interface icons use a consistent rounded outline set at 2–2.5px stroke. They
remain simpler than stickers. A sticker can contain an icon, but ordinary
utility actions should not become illustrated objects unnecessarily.

### 9.4 Paper and print effects

Allowed effects include subtle grain, halftone fields, photocopy
misregistration, edge scuff, tape translucency, and metallic highlight. Effects
are rasterized or composited efficiently and have a flat fallback. Text is never
baked into texture when it must remain accessible or localizable.

## 10. Layering

| Layer            | Token | Typical content                       |
| ---------------- | ----: | ------------------------------------- |
| base             |     0 | page background                       |
| surface          |    10 | boards and cards                      |
| local decoration |    20 | noninteractive sticker accents        |
| local control    |    30 | active card, peel, stack controls     |
| navigation       |    50 | sticky navbar                         |
| trail/cursor     |    60 | pointer visuals within bounded region |
| popover          |    70 | tooltips, menus, control panels       |
| modal            |    80 | Copy Prompt sheet/dialog              |
| toast            |    90 | transient confirmation                |

Components create local stacking contexts so a trail or peel cannot escape into
navigation or modal layers. Authors should not need arbitrary z-index values.

## 11. Motion system

### 11.1 Curves and timing

- immediate feedback: 80–120ms;
- press/release: 140–200ms;
- stick/lift: 180–260ms;
- component entrance: 320–520ms;
- large composition reveal: 550–800ms;
- ambient loop, when justified: 6–12s.

Core curves:

- `--sui-ease-out`: `cubic-bezier(0.22, 1, 0.36, 1)`;
- `--sui-ease-in-out`: `cubic-bezier(0.65, 0, 0.35, 1)`;
- `--sui-ease-press`: `cubic-bezier(0.2, 0.9, 0.3, 1)`.

Spring equivalents target low-to-moderate bounce: approximately stiffness 420,
damping 30, mass 0.8 for controls; stiffness 260, damping 22, mass 1 for larger
stickers. Values are guidance, not a requirement for a spring library.

### 11.2 Motion vocabulary

- **stick:** 0.78 to 1.04 to 1 scale with a short opacity entrance;
- **lift:** translate -2 to -5px while the hard shadow grows;
- **press:** translate toward the shadow by 3–7px;
- **settle:** velocity tilt returns to zero without oscillating more than once
  visibly;
- **peel:** corner rotates around a fixed origin and reveals a shadowed
  underside;
- **shuffle:** active stack item moves out, changes depth, then returns behind;
- **scatter:** short finite radial movement, never an endless particle field.

### 11.3 Reduced motion

When `prefers-reduced-motion: reduce` is active:

- pointer trails and custom cursor movement are disabled;
- peel becomes immediate state replacement or a 100ms opacity change;
- stacks change active item without travel or rotation;
- entrances render in place or use a brief opacity change;
- ambient loops stop in a composed resting frame;
- hover and press retain border, color, or shadow feedback without translation.

The docs also provide a visible “reduce effects” preference that can lower
intensity independently of the operating-system setting; it never overrides a
system request for less motion.

## 12. Pointer and cursor language

The native pointer remains the baseline. Custom cursor visuals are appropriate
only inside a clearly bounded canvas, hero, or showcase. Text selection,
editable controls, resize handles, embedded media, and operating-system
affordances retain native behavior.

Pointer-following artwork sits under the semantic interaction layer with
`pointer-events: none`. It uses container-local coordinates, never causes
horizontal overflow, and disappears cleanly when the pointer leaves the region.
Fine-pointer detection is combined with hover capability; device width is not
used as a proxy.

## 13. Component specifications

### 13.1 Sticker

**Purpose:** render a coherent sticker visual from an asset, icon, or custom
child.

**Anatomy:** content; optional inner ink outline; paper cut line; optional hard
shadow; optional accessible label; optional pressable wrapper.

**Sizing:** 24px minimum for a purely visual inline asset; 44px minimum when
interactive. Named visual sizes are `xs` 32, `sm` 48, `md` 72, `lg` 112, `xl`
160px, with free CSS sizing supported.

**States:**

- idle: stable bounded rotation and stuck depth;
- hover/focus: lift and slightly stronger outline; focus also receives an
  external focus ring;
- active: press toward the shadow plane;
- disabled: no lift, muted palette, retained outline, and disabled semantics;
- loading: only for pressable custom compositions, with a visible label or
  progress indicator rather than an endlessly spinning sticker.

**Entrance/exit:** optional stick motion; exit is a short scale/opacity
transition. Default rendering has no automatic entrance to avoid repeated page
motion.

**Mobile:** same silhouette with reduced shadow offset and rotation. Interactive
size stays at least 44px.

**Accessibility:** decorative by default only when no label or semantics are
provided. Meaningful images require alternative text; custom children follow
normal semantics.

**Customization:** asset, content, size, rotation, seed, outline, cut line,
shadow, tone, material, intensity, as-child composition, and class/style hooks.

**Use:** status marker, illustrated action, selectable object, annotation.<br />
**Misuse:** replacing text labels for critical actions, rotating long content,
or placing dozens without hierarchy.

### 13.2 StickerBadge

**Purpose:** label, filter, tag, or indicate compact state.

**Anatomy:** optional sticker/icon; text; optional remove control; paper/label
silhouette; selection mark.

**Sizing:** 32px compact, 40px default, 48px large height. Horizontal padding
12–18px. Text remains one line; long labels truncate only when the full value is
available elsewhere.

**Appearance:** label or stamp shape, 1.5–2px outline, 3–5px hard offset.
Rotation is 0–2° and disabled in dense filter rows.

**States:** idle uses paper; hover lifts; selected swaps to an accent fill and
adds a visible check/notch; active presses; focus uses an external ring;
disabled retains text contrast; removable badges expose a distinct remove
target. Loading is not supported.

**Mobile:** wraps in rows; no horizontal drag-only carousel for essential
filters.

**Accessibility:** static badges are noninteractive; selection uses button
semantics and `aria-pressed`; remove actions have explicit names.

**Customization:** tone, shape, leading asset, selected mark, size, rotation,
and group spacing.

**Use:** categories, selected themes, status with text.<br /> **Misuse:**
multi-line prose, unexplained color-only states, or using a removable tag as a
checkbox without semantics.

### 13.3 StickerButton

**Purpose:** provide a primary or characterful secondary action.

**Anatomy:** optional leading sticker/icon; label; optional trailing arrow;
surface; outline; hard shadow; focus ring; optional progress label.

**Sizing:** 44px compact, 52px default, 60px large height. Horizontal padding
18–26px. Icon-only use is allowed only with an accessible name and 44px target.

**Variants:** `ink`, `ultraviolet`, `acid`, `paper`, and custom accent. Primary
actions use ink or ultraviolet; acid is paired with ink text.

**States:** idle is stuck; hover lifts 2px; active moves 4–6px toward its
shadow; focus shows a two-part ring independent of shadow; disabled removes lift
and reduces saturation; loading keeps width stable, changes label to a progress
phrase, sets busy state, and prevents repeated activation.

**Motion:** arrow or sticker may nudge 2–4px after the surface lift. No looping
icon motion. Reduced motion retains color and shadow state without translation.

**Mobile:** full-width only when layout requires it; label remains visible.
Shadow offset decreases to preserve space.

**Accessibility:** native button or anchor semantics through composition;
loading and disabled behavior follows the chosen element correctly.

**Customization:** as-child, tone, size, shape, asset slots, shadow, intensity,
loading label, full width.

**Use:** hero action, confirm, playful navigation.<br /> **Misuse:** every
action on a page, tiny toolbar controls, or replacing destructive semantics with
a cheerful accent.

### 13.4 StickerTrail

**Purpose:** create a responsive trail of functional brand or thematic visuals
within a bounded region.

**Visual behavior:** stickers appear along the pointer path based on distance
traveled. Slow movement creates a closer, deliberate sequence; fast movement
spaces items farther apart and interpolates enough points to avoid gaps. Items
stick in with a slight overshoot, hold briefly, then fade/scale away or settle
behind newer items.

**Anatomy:** scoped container; noninteractive render layer; sticker sequence;
optional static fallback; optional debug bounds in development examples.

**Default preset (`scout`):** 64–92px stickers, 34–58px effective spacing
according to velocity, ±12° rotation, 0.9–1.08 scale range, 1100ms life, maximum
24 active items. Defaults are refined during performance validation.

**Presets:**

- `calm`: 52–72px, wider spacing, ±6°, maximum 14;
- `scout`: balanced default;
- `dense`: smaller stickers and closer spacing, maximum 32;
- `floaty`: longer life, slower fade, small upward drift, maximum 20;
- `chaos`: wider scale/rotation variance but the same hard safety ceiling as
  `dense`; docs label it high intensity.

**Layering:** the trail sits above decorative background but below navigation,
controls, text-selection affordances, dialogs, and tooltips. Stickers may
overlap hero text visually only when contrast remains readable and the content
is still selectable.

**Idle:** no nodes until input.<br /> **Hover/move:** spawns according to
path.<br /> **Click:** unchanged by default; optional burst feedback is not part
of v0.1.<br /> **Leave:** existing nodes complete their short exit; no new nodes
spawn.<br /> **Disabled/reduced motion:** render nothing or one authored static
sticker fallback. **Loading:** not applicable.

**Touch:** off by default. Optional `tap` mode places one temporary sticker per
deliberate tap; it must not interfere with scroll or gesture navigation.

**Accessibility:** entirely decorative and hidden from assistive technology. It
cannot be the only feedback for any action.

**Customization:** sticker sources, preset, size range, spacing range, lifetime,
max active, rotation, scale, exit style, sequence mode, seed, target/container,
z-layer, touch mode, and reduced-motion fallback.

**Use:** bounded hero, creative canvas, product showcase.<br /> **Misuse:**
site-wide reading pages, data entry, mobile scroll surfaces, or an unbounded
full-session history.

### 13.5 StickerCursor

**Purpose:** give a bounded showcase a sticker cursor with velocity and state
personality.

**Anatomy:** target region; visual cursor; hotspot; default, hover, active, and
disabled assets; optional tiny click echo; native-cursor restoration boundary.

**Sizing:** 32–56px default; never so large that it hides the target. Hotspot is
explicit and previewed in docs.

**Behavior:** position follows the latest pointer once per animation frame.
Rotation tilts no more than ±14° based on smoothed horizontal velocity and
settles toward zero. Optional squash/stretch is capped at 8%. Interactive
descendants can select named cursor states through data attributes or a
resolver.

**States:**

- initializing: native cursor remains visible;
- ready/default: custom cursor appears and native cursor hides only inside the
  target;
- hover: visual swaps or accents without changing hotspot;
- active: 0.9–0.96 scale press and optional short echo;
- disabled region: native cursor returns immediately;
- leave/unmount: native cursor is restored with no flash;
- reduced motion/coarse pointer: component does not replace the native cursor.

**Focus and keyboard:** cursor visuals do not appear for keyboard focus and
never replace focus rings. Cursor state is supplemental.

**Customization:** assets by state, size, hotspot, tilt, smoothing, settle,
click feedback, target, interactive resolver, disabled selectors, and
hide-native policy.

**Use:** art canvas, component demo, playful product hero.<br /> **Misuse:**
whole operating application, text editor, form flow, resizable regions, or a
cursor whose hotspot does not match its artwork.

### 13.6 StickerNavbar

**Purpose:** turn navigation into a signature sticker composition while
retaining fast orientation and access.

**Shared anatomy:** brand slot; primary links; optional audience or mode switch;
primary action; active indicator; mobile menu trigger; decorative structure;
scroll progress optional.

#### Ribbon variant

A single continuous 8–12px stroke travels behind and around navigation anchors.
It does not intersect labels or buttons. On initial load, the ribbon may reveal
from left to right over 700–1100ms; reduced motion shows it immediately. The
ribbon uses rounded joins and one accent color with a restrained shadow.

#### Collage variant

A 64–80px strip uses original label, stamp, and object stickers on a paper or
night background. Navigation links sit on their own high-contrast sticker
surfaces. The collage is dense but the functional layer remains visually
obvious.

**Desktop:** 72–80px sticky height, brand left, mode switch near center when
present, links and primary action right. Active links receive an outline,
underline doodle, or selected sticker state—not color alone.

**Tablet:** low-priority links move into a menu below 1024px; brand, mode
switch, and primary action remain when space permits.

**Mobile:** 64–68px sticky bar. Decoration crops rather than scales to
illegibility. The visible surface contains brand or mode switch, one primary
action, and a menu trigger. The menu opens as a full-width paper sheet with
large links, current-page mark, and no hover-only interactions. At widths below
380px, labels may shorten only when accessible names remain complete.

**States:** sticky idle; scrolled state may reduce decoration contrast but not
height abruptly; hover lifts individual sticker links; active presses; focus
uses external ring; menu-open visibly changes the trigger; disabled links are
generally omitted rather than shown. Loading is not supported.

**Customization:** variant, tone, ribbon path, collage assets, brand, links,
active item, switch slot, action slot, sticky behavior, scroll progress, menu
labels, and density.

**Use:** expressive marketing or docs site.<br /> **Misuse:** arbitrary SVG path
colliding with controls, unreadable collage behind text, or preserving desktop
link density on mobile.

### 13.7 StickerPeel

**Purpose:** reveal a meaningful second layer using the metaphor of lifting an
applied sticker.

**Anatomy:** base surface; peel face; corner or edge grip; underside; revealed
layer; accessible toggle; optional progress only for pointer drag enhancement.

**Sizing:** minimum interactive area 160×120px; peel grip visually 36–56px with
a 44px hit target. Supported origins are four corners; edge peel is deferred
unless it proves distinct.

**Appearance:** the resting corner curls 8–14% of the shorter side. The
underside is paper-muted with a soft local shadow. The revealed layer must have
its own complete layout rather than text distorted on a 3D plane.

**States:**

- idle: small authored curl signals discoverability;
- hover/focus: curl increases slightly and a label such as “Peel” appears when
  needed;
- active/drag: peel follows a bounded progress curve;
- open: second layer is stable, toggle indicates “Close” or “Stick back”;
- disabled: no curl animation and toggle disabled visibly;
- loading: if revealed content loads, the open layer uses a normal accessible
  loading pattern;
- exit/close: reverses without hiding focus.

**Keyboard/touch:** Enter or Space toggles. Tap toggles. Drag is optional
enhancement and never the only method. Escape closes when focus is within an
open peel configured as disclosure.

**Reduced motion:** immediate swap or short crossfade; the resting curl may
remain static.

**Customization:** origin, open state, default open, reveal label, close label,
peel size, tone, material, drag enhancement, threshold, and layer slots.

**Use:** before/after, answer reveal, product detail, alternate artwork.<br />
**Misuse:** hiding required instructions, long documents, irreversible actions,
or requiring precise corner dragging.

### 13.8 StickerStack

**Purpose:** browse a small, visually layered sequence while keeping the active
item readable.

**Anatomy:** stack stage; 2–5 visible layers; active card; next/previous
controls; position label; optional thumbnails; live-region summary for item
change.

**Sizing:** active card minimum 240×280px; large editorial stack 360–520px wide.
Background layers offset 8–18px and rotate within intensity limits.

**Behavior:** only the top item is interactive. Next moves the active item
aside, changes ordering, and settles it behind. Previous reverses the conceptual
order. Optional drag/swipe requires a clear threshold and snaps back when
cancelled.

**States:** idle shows depth; hover/focus lifts the active card or controls;
active drag reduces shadow and follows one axis; changing state temporarily
blocks duplicate navigation; empty renders a caller-provided empty state;
disabled controls remain visible only when useful; loading uses stable-size
skeleton content inside the active card, not rotating placeholders.

**Keyboard:** next/previous buttons are always available. Arrow keys may
navigate when the stack itself has focus and the behavior is documented. Home
and End are optional for finite stacks. Focus remains on the initiating control;
it is not moved into the new card automatically.

**Mobile:** one active card plus hints of two layers; swipe enhancement;
controls remain 44px. Card content scrolls internally only when explicitly
configured and does not conflict with swipe direction.

**Reduced motion:** direct reorder with opacity or no transition; rotations can
remain static.

**Customization:** items, render item, index/default index, on-index-change,
visible count, loop, axis, drag, keyboard, rotations, offsets, intensity,
labels, and empty state.

**Use:** stories, testimonials, examples, small collections.<br /> **Misuse:**
hundreds of records, primary navigation, dense forms, or content whose ordering
must all be visible at once.

## 14. Documentation website language

The docs site is a production example of Scout UI. Its structure resembles an
editorial sticker book, not a generic dashboard sidebar.

### 14.1 Global frame

- Sticky `StickerNavbar`, collage on night sections and ribbon/paper treatment
  on light reading pages.
- A slim “page edge” index on desktop shows the current section as stacked
  sticker tabs; it becomes a normal table-of-contents sheet on mobile.
- Main reading surfaces are calm paper fields with clear headings and code
  blocks.
- Interactive previews occupy bolder night or accent boards.
- Decorative assets respond locally, not across the entire site.
- Search is always reachable through navigation and `/` keyboard shortcut, with
  a conventional dialog and visible results.

### 14.2 Homepage

1. **Navbar:** collage strip, product mark, Components, Stickers, Playground,
   Examples, GitHub, search, and a “Start sticking” action.
2. **Hero — UI that sticks:** split editorial composition. Left: oversized
   headline and two actions. Right: a live bounded canvas combining StickerTrail
   with a small StickerStack. The canvas pauses when offscreen and is
   reduced/static on touch or reduced motion.
3. **Proof strip:** three direct claims—functional primitives, production
   performance, configuration-aware handoff—presented as large stamp labels, not
   statistic cards.
4. **Signature field guide:** five full-width alternating scenes for Trail,
   Cursor, Navbar, Peel, and Stack. Each scene demonstrates one interaction with
   a short code sample.
5. **From config to handoff:** a live control changes one StickerTrail property;
   generated code and AI prompt visibly update in a layered paper composition.
6. **Sticker pack spread:** an art-directed contact sheet with filters and
   license note. Hover reveals metadata; keyboard focus provides the same
   information.
7. **Works with your stack:** restrained integration row for React, Next.js, CSS
   variables, and user assets. No inflated partner-logo wall.
8. **Open-source invitation:** contribution routes shown as sticker tabs—code,
   accessibility, artwork, documentation.
9. **Final action:** oversized paper label over a night field: “Make something
   that sticks.” Install command, Components action, GitHub action.
10. **Footer:** practical links, package versions, license boundaries, status,
    and attribution on a calm dark surface.

### 14.3 Homepage wireframe

```text
[collage StickerNavbar =======================================]

[H1 UI THAT STICKS.]         [bounded live sticker canvas     ]
[short positioning]          [Trail + Stack, one active effect]
[Browse components] [GitHub] [                                 ]

[FUNCTIONAL]      [FAST]       [AI-READY]      <- stamp strip

[Trail demo =================] [copy + tiny code]
[copy + tiny code] [Cursor demo ============================]
[Peel / Stack / Navbar alternate as full-width field-guide rows]

[controls] [preview] [generated code + generated prompt sheets]

[original sticker pack contact sheet ========================]

[open source contribution tabs]       [final install label]
[footer =====================================================]
```

## 15. Component index

The component index is a pinboard, not a uniform card grid.

- Signature components receive large irregular placements with live or poster
  previews.
- Foundation components occupy smaller label and paper tiles.
- Filters use `StickerBadge` but the results remain a semantic list.
- Each item shows maturity, package, capability icons for keyboard/touch/SSR,
  and one-line purpose.
- Hover motion is limited to the focused tile; offscreen demos do not run.
- Mobile becomes a single reading column with alternating edge accents and no
  masonry reordering.

## 16. Individual component page

### Desktop structure

```text
[breadcrumb sticker] [component name + purpose] [package/version]
[Install] [Source] [Issue]

[preview stage =======================] [controls paper rail]
[                                      ] [search within props]
[                                      ] [preset / values]
[======================================] [reset / share]

[Code tab] [AI Prompt tab] [Open full playground]
[generated sheet ============================================]
[Copy Code or Copy AI Prompt]

[Usage] [API] [Accessibility] [Performance] [Examples]
[previous component]                         [next component]
```

The preview stage owns the loudest visual treatment. The rest of the page is
calm. Controls are grouped by intent—Content, Appearance, Motion, Behavior,
Accessibility—not exposed as an undifferentiated prop list.

### Tablet and mobile

The preview remains first. Controls move into a bottom sheet or collapsible
paper section, never a permanently narrow side rail. Generated output follows
immediately after controls. Preview, code, and prompt state stay synchronized.
The primary copy action is sticky only while its corresponding output is
visible.

### Loading and errors

- The preview uses a fixed minimum size to avoid layout shift.
- Client-only interactions show an authored static poster until hydrated.
- If a demo fails, the page retains installation, API, source, and a clear retry
  action.
- Generated code and prompt are available from defaults even if the live preview
  fails.

## 17. Copy Code experience

Copy Code is a direct action on a visible generated sheet.

- The code is always inspectable before copying.
- A compact format selector appears only when variants genuinely differ.
- The button label changes to “Copied” for two seconds and announces success
  politely.
- Clipboard failure reveals selectable text and a manual-copy instruction.
- Non-default configuration is highlighted briefly when a control changes.
- Code uses a quiet ink-on-paper or paper-on-night syntax theme with a 2px
  outline and 6px offset shadow, not a glass terminal.

## 18. Copy AI Prompt experience

Copy AI Prompt sits beside Copy Code with equal visual weight, not in an
overflow menu.

The first activation opens a paper sheet showing:

- target component and package;
- detected or selected framework;
- current configuration summary;
- integration context fields: page/section, asset source,
  preserve-existing-layout toggle;
- concise/detailed prompt length;
- the complete generated prompt;
- Copy Prompt and Reset actions.

Every changed playground control updates the configuration summary and prompt.
Changed prompt fragments receive a brief paper-highlight animation. The prompt
sheet includes a persistent note: generation is local; no repository data is
sent.

On desktop, the sheet may sit beside the preview or open as a large layered
dialog. On mobile, it is a full-height bottom sheet with a visible close
control, focus trap, return-focus behavior, and fixed Copy Prompt action. It
never blocks access to the underlying component documentation once closed.

## 19. Sticker packs page

The pack browser resembles a printed contact sheet with tabs by family. Each
sticker tile shows the art at a consistent optical size, name, tags, license,
and available formats. Users can copy an import, download an individual asset
where licensing permits, or add it to a playground selection.

The page includes an explicit “Bring your own stickers” guide. Search and
filters are semantic controls. Pack previews do not rotate every tile; variety
comes from the artwork and occasional authored placement.

## 20. Full playground

The playground uses three linked regions:

1. a large bounded preview canvas;
2. a control deck grouped by intent; and
3. a layered output desk for Code and AI Prompt.

Desktop uses a 7/5 preview-to-controls split with outputs below or in a
resizable lower deck. Tablet stacks preview above controls. Mobile uses preview,
a sticky “Customize” trigger, and a bottom sheet. URL sharing is visible near
Reset, not hidden.

Preset changes animate only the component, not the entire layout. Reset is
always available and asks for confirmation only when the configuration is
materially changed. Share produces a copied URL confirmation and never includes
free-form sensitive text by default.

## 21. Guides and documentation

Guides use the calmest visual mode: paper background, strong editorial headings,
code, diagrams, and occasional margin stickers that label rather than distract.
Desktop may use a sticky table of contents styled as stacked tabs; mobile uses a
normal disclosure.

Core guides include installation, styling, theming, asset authoring, motion and
reduced motion, SSR/Next.js, performance, accessibility, AI handoff,
contributing, and migration.

## 22. Examples

Example pages are full compositions rendered with the published packages. Each
includes a poster, live route, source, dependency list, accessibility notes, and
“Use this pattern” AI prompt. Examples must show Scout UI integrated with
ordinary forms and content so users learn restraint.

## 23. Changelog and open-source pages

### Changelog

Releases appear as dated paper sheets pinned to a vertical ink line. Breaking
changes use orange warning labels; fixes and accessibility changes use clear
text tags. Entries remain searchable and link to migration notes.

### GitHub/open-source

The page explains governance, package status, issue routes, contribution areas,
licensing, and asset provenance. Contributor portraits or avatars may appear as
stickers with accessible names. Repository metrics are secondary to contribution
instructions.

## 24. Navigation behavior

- Sticky navigation never obscures an anchor target; scroll margin matches its
  height.
- Current-page and current-section states are visible without hover.
- Search shortcut `/` is ignored inside inputs and editors.
- Escape closes the topmost sheet or menu.
- Mobile menu focus is trapped while open and returns to the trigger.
- Route changes place focus on the page heading or a managed route-announcement
  target.
- Scroll progress is decorative and hidden from assistive technology.

## 25. Responsive behavior

### Desktop, 1280px and above

Use the full editorial grid, bounded overlaps, side-by-side playground controls,
and collage/ribbon navigation. Keep readable text within 760px even on wide
displays.

### Small desktop/tablet, 768–1279px

Reduce overlap by roughly one third, collapse secondary navigation into a menu
below 1024px, stack complex hero compositions, and move control rails below
previews. Preserve large type but reduce line count before reducing font size
excessively.

### Mobile, below 768px

Use 20px page edges, 64–68px navigation, one primary column, smaller hard
shadows, and fewer simultaneous decorative assets. Crop collage backgrounds
intentionally. Full-width buttons are allowed for primary flows. Horizontal
scrolling is reserved for explicitly browsable visual collections and includes
snap, labels, and keyboard alternatives.

### Very small mobile, below 380px

Shorten visible secondary labels, remove nonessential decorative stickers, stack
paired actions, and preserve full accessible names. Never shrink core text below
16px or targets below their minimum.

## 26. Accessibility and forced-color design

- All interactive states have a non-motion, non-color signal.
- Focus rings sit outside hard shadows and use 3px minimum visual thickness.
- In forced-colors mode, textures, background images, and custom shadows may
  disappear; system borders and outlines replace them.
- Visual overlap never clips focused controls.
- Text remains selectable even when a trail passes over it.
- Static sticker artwork does not pollute the accessibility tree.
- Components are tested at 200% zoom and with reflow at 320 CSS pixels.
- Documentation examples expose reduced-motion and keyboard behavior next to
  visual controls.

## 27. Design review checklist

A Scout UI design is ready for implementation only when:

- one clear anchor exists per viewport;
- every sticker has a communicative or interaction role, or is explicitly
  decorative;
- no more than one loud motion owns the viewport;
- rotations and overlaps stay inside the selected intensity limits;
- text contrast and line length remain readable;
- pointer behavior has touch, keyboard, and reduced-motion decisions;
- focus order follows semantics and focus visuals survive overlap;
- mobile is recomposed rather than merely scaled;
- texture and shadows have flat fallbacks;
- open-source artwork provenance is known;
- the page still works when decorative assets and motion are removed.

## 28. Design decision summary

Scout UI's visual identity is not “stickers everywhere.” It is a strong
editorial foundation interrupted by tactile, functional sticker moments. The
palette, type, cut lines, hard depth, materials, motion vocabulary, intensity
limits, and responsive rules make those moments coherent. The docs site
demonstrates the system through its structure—field-guide scenes, contact
sheets, layered generated outputs, and bounded interaction canvases—while
preserving familiar navigation, search, reading, and accessibility behavior.
