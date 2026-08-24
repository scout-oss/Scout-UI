# Browser test contract

The browser matrix covers Chromium, Firefox, WebKit, desktop, tablet, mobile,
reduced motion, coarse pointer, and forced colors. Touch, pointer, motion, and
forced-color projects use Playwright emulation; release candidates still need
manual checks on representative physical devices and assistive technology.

On failure Playwright retains a screenshot, trace, and video under
`.artifacts/playwright/test-results`. Accessibility violations and captured
browser errors are attached to the failing test result.

CI deliberately separates these responsibilities:

- `Browser / Interaction and accessibility matrix` runs every non-visual spec
  across the supported Chromium, Firefox, and WebKit projects with Playwright's
  screenshot comparisons ignored. Behavioral and accessibility assertions are
  unchanged.
- `Visual / Linux visual contract` runs only screenshot-contract specs in the
  Chromium projects that own committed baselines. Four historical consumer
  screenshots remain in `consumer.spec.ts` to preserve their snapshot paths and
  are selected by exact test title.

The Browser workflow installs Chromium, Firefox, and WebKit. The Visual workflow
installs Chromium only; Firefox and WebKit visual pixels are not part of the
v0.1 baseline contract.

## Visual baselines are scoped per operating system

Screenshot baselines live under:

```text
tests/browser/__screenshots__/<platform>/<spec file>/<name>-<project>.png
```

`<platform>` is Node's `process.platform` — `win32`, `linux`, or `darwin` —
supplied by the `{platform}` token in `snapshotPathTemplate`.

This is deliberate. Font rasterisation and text metrics differ enough between
operating systems that one shared baseline cannot be correct everywhere: the
same documentation page renders tens of pixels taller or shorter on Windows than
on the platform the project's first baselines came from, at a 6–17% pixel
difference. A single shared set forces every contributor who is not on the
authoring platform to either see permanent false failures or overwrite everyone
else's baselines. Per-platform sets remove that conflict entirely.

### Adding a platform

A platform with no baselines yet generates a complete set on its first run.
Playwright writes the missing files and fails the run once; re-run to confirm,
then commit the new directory. To refresh an existing set deliberately:

```bash
node tooling/fixtures/run-browser-harness.mjs --visual
```

That passes `--update-snapshots`, which only ever writes to the current
platform's directory. Baselines belonging to other platforms are never touched,
so refreshing on one machine cannot silently invalidate another.

Every baseline change still requires review and a written explanation, exactly
as before.

On GitHub Linux, all visual groups are attempted even when one group discovers
missing snapshots. The workflow uploads `.artifacts/playwright/` together with
`tests/browser/__screenshots__/linux/`, whose files already use their intended
repository paths. A maintainer downloads and inspects every candidate, imports
only approved genuine Linux images, and commits them manually. CI never copies
another platform, commits a candidate, pushes a baseline, or approves pixels.

### `_original-platform/`

The four baselines committed before per-platform scoping are preserved
byte-for-byte under `__screenshots__/_original-platform/`.

`_original-platform` is not a value `process.platform` can produce, so
Playwright never resolves to it. That is intentional: **the operating system
that produced those files is not recorded anywhere in this repository**, and
labelling them `linux` or `darwin` would assert something unverified. They are
kept as the historical reference set rather than discarded.

Whoever identifies the platform that reproduces them should rename the directory
to that platform's name in a single move, at which point the set becomes live
for that platform. Until then, each platform owns the baselines it generated
itself.
