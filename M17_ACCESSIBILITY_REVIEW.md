# Milestone 17 accessibility review

Date: 2026-08-23  
Baseline: `5f787eb8697d768de1cc0aa9cbdd516af4e7e488`  
Status: **COMPLETE — required manual screen-reader pairings executed**

This review records automated, browser-semantic, keyboard, capability, reflow,
and visual evidence. It does not claim WCAG conformance. Axe and browser
accessibility-tree inspection are useful defect detectors, but neither is a
screen reader.

## Method

- Axe was run after interactions had settled on every component reference, every
  example, the homepage, component index, playground, sticker browser, examples
  index, and major guides.
- Keyboard paths covered Tab, Shift+Tab, Enter, Space, Escape, documented arrow
  behavior, skip navigation, dialogs, focus return, share, Copy Code, and Copy
  AI Prompt.
- Chromium's full accessibility tree was inspected for inactive Stack content,
  decorative Trail and Cursor output, names, states, and dialog/live-region
  boundaries.
- Reflow used a 320 CSS-pixel viewport. This is also the portable automated
  proxy used for effective 200% reflow; it is not represented as physical
  browser-zoom operation.
- Forced-colors, reduced-motion, touch, and coarse-pointer projects used the
  repository's Playwright emulation. Those checks do not replace physical
  assistive-technology or device testing.
- Eight deterministic Darwin images were generated and inspected at full size.

## Surface matrix

`PASS` means the applicable automated/manual browser-semantic checks passed.
`N/A` means the mode does not create a distinct interaction for that surface.
`NOT SUPPLIED` means the later human report did not claim that additional
surface; it is not converted into a screen-reader pass.

| Surface                        | Keyboard | Focus | Touch | Reduced motion | Forced colors | 200% | 320  | Axe  | AX tree                             | VoiceOver + Safari | NVDA + Firefox | Result                 |
| ------------------------------ | -------- | ----- | ----- | -------------- | ------------- | ---- | ---- | ---- | ----------------------------------- | ------------------ | -------------- | ---------------------- |
| Sticker                        | PASS     | PASS  | PASS  | PASS           | PASS          | PASS | PASS | PASS | PASS                                | PASS               | PASS           | PASS                   |
| StickerBadge                   | PASS     | PASS  | PASS  | PASS           | PASS          | PASS | PASS | PASS | PASS                                | PASS               | PASS           | PASS                   |
| StickerButton                  | PASS     | PASS  | PASS  | PASS           | PASS          | PASS | PASS | PASS | PASS                                | PASS               | PASS           | PASS                   |
| StickerTrail                   | PASS     | PASS  | PASS  | PASS           | PASS          | PASS | PASS | PASS | PASS (decorative layer absent)      | PASS               | PASS           | PASS                   |
| StickerCursor                  | PASS     | PASS  | PASS  | PASS           | PASS          | PASS | PASS | PASS | PASS (visual absent)                | PASS               | PASS           | PASS                   |
| StickerPeel                    | PASS     | PASS  | PASS  | PASS           | PASS          | PASS | PASS | PASS | PASS (inactive layer inert/hidden)  | PASS               | PASS           | PASS                   |
| StickerStack                   | PASS     | PASS  | PASS  | PASS           | PASS          | PASS | PASS | PASS | PASS (background cards inert)       | PASS               | PASS           | PASS                   |
| StickerNavbar                  | PASS     | PASS  | PASS  | PASS           | PASS          | PASS | PASS | PASS | PASS (landmark/dialog/current page) | PASS               | PASS           | PASS                   |
| Search dialog/results          | PASS     | PASS  | PASS  | N/A            | PASS          | PASS | PASS | PASS | PASS                                | PASS               | PASS           | PASS                   |
| Copy Code                      | PASS     | PASS  | PASS  | PASS           | PASS          | PASS | PASS | PASS | PASS                                | PASS               | PASS           | PASS                   |
| Copy AI Prompt                 | PASS     | PASS  | PASS  | PASS           | PASS          | PASS | PASS | PASS | PASS                                | PASS               | PASS           | PASS                   |
| Share state                    | PASS     | PASS  | PASS  | N/A            | PASS          | PASS | PASS | PASS | PASS                                | NOT SUPPLIED       | NOT SUPPLIED   | PASS (automated scope) |
| Sticker browser/controls       | PASS     | PASS  | PASS  | PASS           | PASS          | PASS | PASS | PASS | PASS                                | NOT SUPPLIED       | NOT SUPPLIED   | PASS (automated scope) |
| Homepage                       | PASS     | PASS  | PASS  | PASS           | PASS          | PASS | PASS | PASS | PASS                                | NOT SUPPLIED       | NOT SUPPLIED   | PASS (automated scope) |
| Component/example/guide routes | PASS     | PASS  | PASS  | PASS           | PASS          | PASS | PASS | PASS | PASS                                | NOT SUPPLIED       | NOT SUPPLIED   | PASS (automated scope) |

## Required scenario inventory

| IDs     | Coverage                                                                                               | Result                                                                    |
| ------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| A01–A03 | decorative, meaningful, and interactive Sticker semantics                                              | PASS                                                                      |
| A04–A06 | static, selected, and removable Badge semantics                                                        | PASS                                                                      |
| A07–A10 | normal, loading, disabled, and anchor Button branches                                                  | PASS                                                                      |
| A11–A13 | Trail semantic silence, control pass-through, touch/reduced motion                                     | PASS                                                                      |
| A14–A17 | Cursor silence, native restoration, editable, coarse/reduced motion                                    | PASS                                                                      |
| A18–A23 | Peel open/close, focus/inert, tap, forced colors, reflow                                               | PASS                                                                      |
| A24–A29 | Stack buttons, keys, announcement, inert cards, touch/reduced motion                                   | PASS                                                                      |
| A30–A33 | Navbar anchors/current state, dialog, return focus, hash offset                                        | PASS                                                                      |
| A34–A45 | Search, copies, share, browser, controls, homepage, examples, 320, 200%, forced colors, reduced motion | PASS; supplied manual result covers Search, Copy Code, and Copy AI Prompt |

## Keyboard and focus findings

- Native controls retain their native activation model. Drag-capable Peel and
  Stack both have complete button/keyboard alternatives.
- Dialogs close with Escape and return focus to their trigger. Inactive Peel and
  Stack layers cannot receive focus.
- The skip link, route focus, sticky hash offset, current-page state, and mobile
  Navbar focus containment remain intact.
- The 3px focus treatment remained visible on paper, night, accent, overlapping,
  dialog, sticky, code, prompt, forced-colors, 320px, and 200%-equivalent review
  surfaces. State is not communicated by color alone.
- Interactive targets retain the documented target size.

## Findings fixed in M17

1. The homepage principle cards and field-guide rows could force a document
   wider than 320 CSS pixels. The responsive grid now allows its content to
   shrink and long inline code wraps locally. Local code overflow remains local.
2. The OG image route carried an unnecessary Edge Runtime declaration that
   produced a current Next.js warning. The route uses no Edge-only capability,
   so the declaration was removed rather than suppressing the warning.
3. The lifecycle resource tracker now covers listeners, observers, animation
   frames, timers, animations, workers, and pointer capture. Its page-injected
   implementation uses platform-safe WeakSets, avoiding transpiler-private-field
   helpers in the browser harness.

No Critical or Serious axe violation remains in the tested state/route matrix.
No unexpected browser console error or warning remains in the final matrix.

## Real screen-reader decision

1. **Was a real screen reader operated?** Yes. The user supplied human-observed
   results for both required pairings after the automated M17 review.
2. **VoiceOver + Safari:** PASS for Sticker, StickerBadge, StickerButton,
   StickerTrail, StickerCursor, StickerPeel, StickerStack, StickerNavbar,
   Search, Copy Code, and Copy AI Prompt. Findings: none.
3. **NVDA + Firefox:** PASS for the same eleven listed surfaces. Findings: none.
4. **Environment details:** session date, OS versions, Safari/Firefox versions,
   and VoiceOver/NVDA versions were not supplied. No values are inferred.
5. **What was manually heard?** Exact spoken phrases were not supplied, so none
   are quoted or reconstructed. Only the supplied per-surface PASS results are
   recorded.
6. **What remains unexecuted?** Neither required pairing remains unexecuted.
   Additional route-by-route screen-reader coverage beyond the eleven supplied
   surfaces is not claimed.
7. **Does this block strict M17 completion?** No. Both authoritative manual
   pairings were reported as genuinely executed with every required listed
   surface passing and no findings.

## VoiceOver + Safari verification contract

This is the contract used to define the required surface review. Future re-entry
should record the spoken output rather than inferring it from markup.

- Sticker: decorative artwork is silent; meaningful artwork exposes its alt;
  interactive Sticker announces a button with a useful name.
- Badge/Button: static badge is text; selected badge announces pressed state;
  remove badge announces its remove label; loading Button communicates busy
  context without losing its name; disabled is announced; anchors announce link.
- Trail/Cursor: generated visuals remain silent; native controls beneath Trail
  work; Cursor falls back to the native cursor for editable/bypass regions.
- Peel: trigger announces button and expanded/collapsed state; after toggling,
  focus is not left inside the layer that becomes hidden/inert.
- Stack: only the active card is navigable; Next/Previous buttons are named;
  each committed move announces exactly one `Item X of Y` update; cancelled
  gestures do not announce a change.
- Navbar: navigation landmark, current page, mobile dialog name, Escape, focus
  containment, and return focus are announced/operable; collage/progress are
  silent.
- Search: dialog name/instructions/results count and result links are coherent;
  empty, loading, and failure states are understandable.
- Copy Code and Copy AI Prompt: trigger names remain stable and successful copy
  feedback is announced once without stealing focus.

## Windows NVDA + Firefox verification contract

For future re-entry, use NVDA with Firefox from a clean checkout—not Playwright
speech simulation.

1. Install and verify the repository (`corepack pnpm install --frozen-lockfile`,
   `corepack pnpm check`, fixture tests, then browser matrix).
2. Repeat the Sticker, Badge/Button, Trail, Cursor, Peel, Stack, Navbar, Search,
   Copy Code, and Copy AI Prompt checklist above.
3. For Stack, verify one spoken position update per committed navigation and no
   update on cancelled swipe.
4. For dialogs, verify their accessible names, reading order, Escape behavior,
   focus containment, and return focus.
5. In Windows High Contrast, separately verify the system focus outline and
   non-color state cues. Do not treat that as the NVDA result itself.
6. Record Firefox/NVDA versions, routes, exact spoken results, defects, and
   retest evidence. Do not copy Darwin screenshots as Win32 baselines.
