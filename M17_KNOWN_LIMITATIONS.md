# Milestone 17 known limitations and re-entry work

This file separates evidence gathered in M17 from work that cannot be claimed on
the current machine.

## Accessibility and platform limitations

- VoiceOver with Safari and NVDA with Firefox were both reported as genuinely
  executed by the user. All eleven supplied surfaces passed in each pairing and
  no findings were reported.
- Session dates, OS versions, browser versions, screen-reader versions, and
  exact spoken phrases were not supplied. No missing value or spoken output is
  inferred.
- Playwright WebKit is not branded Safari and does not establish Safari plus
  VoiceOver compatibility.
- The full 1,864-case local docs runner twice exposed Playwright WebKit process
  degradation: a navigation that normally completes in under two seconds hung
  until Playwright's 90-second test timeout, and context teardown also hung. The
  affected project/route moved between runs. Fresh isolated reruns of the same
  representative playground smoke passed in WebKit desktop (1.2 s) and WebKit
  mobile (0.834 s). This is recorded as environment-dependent runner noise, not
  converted into a product pass or hidden behind a retry.
- Playwright forced-colors emulation is not a physical Windows High Contrast
  session. Win32 visual verification remains genuine Windows work and is not
  inferred from the supplied NVDA result.
- The automated 320 CSS-pixel viewport is the portable reflow proxy for
  effective 200% zoom; a human browser-zoom review should still be repeated with
  each real screen-reader pairing.
- M17 numeric performance observations are reference measurements from Chromium
  on the recorded Mac. Firefox interaction correctness and isolated WebKit
  interaction checks passed, but no claim of numerically equivalent browser
  performance is made.
- Consumer custom themes and custom artwork can create contrast, focus, sizing,
  or content problems outside the defaults tested by Scout UI. Consumers retain
  responsibility for reviewing their final composition.

The required real screen-reader pairings are complete, so these evidence-detail
limitations do not keep M17 open. They are not waivers for Critical/Serious
defects, traps, hidden alternatives, unbounded work, or lifecycle leaks.

## Genuine Windows verification commands

Run from a fresh Windows checkout on `main`. Do not copy or rename Darwin
images.

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm check
corepack pnpm test:fixtures
corepack pnpm test:browser

corepack pnpm --filter @scout-ui/docs test:visual -- tests/browser/docs-foundation-visual.spec.ts --workers=1
corepack pnpm --filter @scout-ui/docs test:visual -- tests/browser/playground-visual.spec.ts --workers=1
corepack pnpm --filter @scout-ui/docs test:visual -- tests/browser/copy-code-visual.spec.ts --workers=1
corepack pnpm --filter @scout-ui/docs test:visual -- tests/browser/prompt-visual.spec.ts --workers=1
corepack pnpm --filter @scout-ui/docs test:visual -- tests/browser/docs-content-m16-visual.spec.ts --workers=1
corepack pnpm --filter @scout-ui/docs test:visual -- tests/browser/docs-hardening-m17-visual.spec.ts --workers=1
```

Inspect every generated Win32 image at full size before accepting it. Leave
Darwin and `_original-platform/` files untouched. Future NVDA + Firefox re-entry
should use the verification contract in `M17_ACCESSIBILITY_REVIEW.md` and record
actual spoken results, versions, routes, defects, fixes, and retest evidence.

## Release boundary

- No public API, component behavior, package export, dependency, or Changeset
  changed in M17.
- No analytics, runtime telemetry, runtime network dependency, publication,
  release workflow, or release credential was added.
- M18 and M19 have not started.
