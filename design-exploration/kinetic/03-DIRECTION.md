# Stage 3 — Creative direction: "Pressure-sensitive"

> Pressure-sensitive adhesive is the technical name for sticker glue: it bonds
> when you press, releases when you peel, and bonds again. Scout UI's site
> should behave the same way.

## Idea in one sentence

Every surface follows the physical life of a sticker — **peel, lift, carry,
slap, settle, stick** — and the headline literally demonstrates the tagline:
pull a letter off, throw it, and it sticks back.

## Typography

- **Display:** Bricolage Grotesque Variable (OFL, self-hosted via
  `next/font/local`, 131 KB latin woff2, `opsz` 12–96, `wdth` 75–100, `wght`
  200–800). Width is the expressive axis: condensed (75–85) for posters and the
  velocity tape, normal (100) for labels, and `wdth`/`wght` respond to pointer
  pressure in the hero.
- **Body/UI:** Inter Variable (OFL, 48 KB latin). Both faces get metric-matched
  fallbacks from `next/font` to avoid layout shift on swap.
- **Mono:** system UI monospace (no download).
- **Scale:** one poster size per page (hero word, page H1, final CTA), one
  section size (`clamp(2.6rem, 6.4vw, 6.2rem)`), then the existing reading
  scale. Tracking is optically tightened only at display sizes (−0.015 to
  −0.022em); body text untouched.
- **Applied labels:** one highlighted word per heading (`*word*` in copy) set on
  an acid label with an ink outline and hard shadow, slightly rotated.

## Layout language

- **Poster, then sheet.** Pages open with a full-measure poster moment, then
  settle into a calm sheet. Loud and quiet sections alternate.
- **Backing and die-cuts.** Collections sit on a dotted "backing sheet" with a
  peeled corner; items are die-cut tiles with a dashed kiss-cut outline offset
  around them. Tiles carry a tiny authored tilt that straightens when picked up
  (hover/focus).
- **Footprint follows job.** Signature engines get the big cuts (Trail wide,
  Peel tall), foundation components get thirds, Navbar runs full width.
- **Asymmetry with anchors.** Text and controls align to the 12-column grid;
  objects may break it (stamps top-right, lead labels overlapping the giant
  word).

## Colour usage

Existing tokens only. Paper/ink foundations; acid = primary action and applied
label; ultraviolet = the brand's face (hero letters, final CTA shadow); hot pink
= punctuation and annotations; cyan = secondary label; night sections for play
areas (desk, final CTA). At most three accents per composition.

## Motion principles

1. **Physics, not timelines.** Springs with velocity inheritance for anything
   the user touches; CSS `linear()` curves sampled from the same springs for
   anything that plays by itself.
2. **Finite or asleep.** No ambient loops. Every animation either finishes or is
   driven by input and stops when input stops. The shared ticker sleeps when
   idle (verified: 0 pending frames, 0 running animations after interaction and
   after the M17 scroll test).
3. **Respond during, not after** (Rauno): carried objects track 1:1; pressure
   responds per frame; release keeps the flick.
4. **One loud thing per viewport.** Engines in specimens are dormant until
   approached or touched.
5. **Restraint for frequency.** Controls used repeatedly get a 140ms press and
   nothing else.
6. **Reduced means calm and complete.** OS reduced motion or the footer's
   "Reduce effects" removes every entrance, reveal, pressure and throw; content
   and controls remain identical.

## Motion grammar (tokens in `app/kinetic.css`)

| Verb   | Where                               | Timing / physics                                          |
| ------ | ----------------------------------- | --------------------------------------------------------- |
| press  | buttons, chips, tiles               | 140ms `--sui-k-ease-press`, collapse into hard shadow     |
| lift   | hover/focus of tiles and chips      | 240ms `--sui-k-ease-lift` (spring k520 c34)               |
| slap   | entrances (letters, labels, stamps) | 460ms `--sui-k-ease-slap` (spring k700 c30), 45ms stagger |
| reveal | section headings                    | 560ms ease-out, word masks, one-way                       |
| carry  | dragged letters/stickers            | spring k900 c52 (follow), velocity tilt                   |
| settle | return home / tile straighten       | spring k190–320, one visible overshoot                    |
| stick  | letter re-attaches                  | adhesive spring k190 c14 + raise collapse                 |
| coast  | velocity tape, thrown stickers      | exponential friction 3.4–6/s, stop below threshold        |

## Interaction vocabulary

- **Grab:** mouse/pen immediately; touch after horizontal intent or a long
  press. Cursor `grab`/`grabbing` only when live.
- **Throw:** release velocity from the last 80ms of samples.
- **Re-stick:** letters always return; desk stickers stay where thrown.
- **Keyboard paths:** "Test the adhesive" (hero), "Shuffle the desk" / "Tidy up"
  (desk), arrow keys and buttons inside every specimen component, inspector
  selection buttons on the drawer page.

## Signature experiences

1. **Pressure-sensitive headline** — die-cut letters swell under the pointer,
   peel off, fly, and stick back.
2. **Velocity tape** — the motion verbs travel only with your scroll and lean
   with its speed.
3. **The specimen sheet** — eight live components on a backing sheet; the
   component index _is_ the demo.
4. **The sticker desk** — the official pack as throwable objects.
5. **The loupe** — a tilting, holographic inspector for each sticker with
   copy-import and a playground deep link.
6. **Arrivals** — page titles rise out of word masks; component names stick on
   letter by letter.
