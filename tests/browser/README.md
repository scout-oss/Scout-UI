# Browser test contract

The browser matrix covers Chromium, Firefox, WebKit, desktop, tablet, mobile,
reduced motion, coarse pointer, and forced colors. Touch, pointer, motion, and
forced-color projects use Playwright emulation; release candidates still need
manual checks on representative physical devices and assistive technology.

On failure Playwright retains a screenshot, trace, and video under
`.artifacts/playwright/test-results`. Accessibility violations and captured
browser errors are attached to the failing test result.

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
