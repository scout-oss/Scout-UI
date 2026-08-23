# Milestone 17 performance baseline

Date: 2026-08-23  
Source baseline: `5f787eb8697d768de1cc0aa9cbdd516af4e7e488`  
Purpose: local regression evidence, not a universal performance promise

## Reference environment

| Item                 | Value                                                  |
| -------------------- | ------------------------------------------------------ |
| Machine              | MacBook Air (Apple M4, 10 logical cores, 16 GB memory) |
| Operating system     | macOS 26.6.2, arm64                                    |
| Node                 | 24.10.0                                                |
| pnpm                 | 11.21.0                                                |
| Playwright           | 1.62.1                                                 |
| Chromium             | 151.0.7922.34                                          |
| Performance viewport | 1280 × 720 CSS px                                      |
| Runner               | isolated Chromium, one worker                          |

Timing and long-task numbers are reference-machine observations. The hard
release invariants are bounded nodes/resources, zero pointer-progress React
commits, cleanup to idle, correct semantic transitions, and preserved fallbacks.
No FPS guarantee is made.

## StickerTrail sustained results

Each default-density run continuously moved the pointer for at least 30 seconds.
The pending frame during sampling is the test's own frame sampler; the engine
returned to zero pending engine frames after settlement.

| Scenario         | Run | Pointer samples | Frames | Median / p95 frame interval | Pool / peak active | React movement commits | Long tasks | Result |
| ---------------- | --: | --------------: | -----: | --------------------------- | ------------------ | ---------------------: | ---------: | ------ |
| default 30s      |   1 |           1,799 |  1,844 | 16.7 / 17.3 ms              | 24 / 9             |                      0 |          0 | PASS   |
| default 30s      |   2 |           1,791 |  1,844 | 16.7 / 16.8 ms              | 24 / 9             |                      0 |          0 | PASS   |
| default 30s      |   3 |           1,796 |  1,844 | 16.7 / 17.0 ms              | 24 / 9             |                      0 |          0 | PASS   |
| hard-ceiling 30s |   1 |           1,800 |      — | —                           | 48 / 48            |                      0 |          0 | PASS   |

Default runs ended with zero active trail nodes. Before/after resources were
stable: timers 0/0, pointer captures 0/0, animations 0/0, IntersectionObservers
9/9, ResizeObservers 8/8, listeners 593/593. The hard-ceiling scenario proved
the configured 48-node cap without growth beyond it. Existing tests cover long
jumps/backfill, offscreen pause/resume, document visibility reset, reduced
motion, and Strict Mode cleanup.

## StickerCursor sustained results

| Run | Duration | Pointer samples | Clicks | Echo max | Frames | Median / p95 frame interval | React movement commits | Long tasks | Result |
| --: | -------- | --------------: | -----: | -------: | -----: | --------------------------- | ---------------------: | ---------: | ------ |
|   1 | >=30s    |           1,797 |     44 |        8 |  1,850 | 16.7 / 17.0 ms              |                      0 |          0 | PASS   |
|   2 | >=30s    |           1,798 |     44 |        8 |  1,848 | 16.7 / 16.9 ms              |                      0 |          0 | PASS   |
|   3 | >=30s    |           1,800 |     45 |        8 |  1,847 | 16.7 / 16.8 ms              |                      0 |          0 | PASS   |

The engine's echo pool remained bounded at eight. Listeners (36/36),
ResizeObservers (2/2), and IntersectionObservers (0/0) remained stable. The
custom cursor settled to idle and the native cursor won on not-ready, editable,
bypass, leave, blur, visibility, capability, asset-error, and unmount paths.

## StickerPeel profile

| Run | Drag cycles | Duration | Pointer samples | Pointer-progress React commits | Pending frames | Long tasks | Result |
| --: | ----------: | -------: | --------------: | -----------------------------: | -------------: | ---------: | ------ |
|   1 |          12 | 3,997 ms |             144 |                              0 |              0 |          0 | PASS   |
|   2 |          12 | 4,097 ms |             144 |                              0 |              0 |          0 | PASS   |
|   3 |          12 | 4,135 ms |             144 |                              0 |              0 |          0 | PASS   |

Committed/cancelled drag semantics, exactly-once callbacks, scroll-intent
handoff, focus-before-inert, reduced motion, pointer-capture release, and
listener cleanup remained correct.

## StickerStack profile

| Run | Swipe cycles | Duration | Pointer samples | Pointer-progress React commits | Max cards / outgoing | Pending frames | Long tasks | Result |
| --: | -----------: | -------: | --------------: | -----------------------------: | -------------------- | -------------: | ---------: | ------ |
|   1 |           12 | 6,712 ms |             168 |                              0 | 4 / 1                |              0 |          0 | PASS   |
|   2 |           12 | 6,624 ms |             168 |                              0 | 4 / 1                |              0 |          0 | PASS   |
|   3 |           12 | 6,841 ms |             168 |                              0 | 4 / 1                |              0 |          0 | PASS   |

Each run had 12 expected semantic commits, stable 140/140 listeners, zero
observer growth, bounded cards, one outgoing card at most, and deterministic
identity. Cancelled gestures generated neither callbacks nor announcements.

## Navbar, dialogs, workers, and homepage

- Ten mobile Navbar dialog cycles left listeners at 295/295, ResizeObservers at
  2/2, IntersectionObservers at 0/0, and zero leaked portals.
- Existing lifecycle suites pass for Search/Pagefind, the Shiki worker, Copy
  Code, Copy AI Prompt timers, route navigation, and dialog portals.
- The homepage profile performed five full-scroll rounds at 1280 × 720 in 4,790
  ms: 0 long tasks, maximum long task 0 ms, layout-shift score 0, zero pending
  frames after settlement, and zero running animations after settlement.
- Offscreen, reduced-motion, and coarse-pointer tests confirm that loud effects
  stop or withdraw work when their required capability is absent.

## Documentation route budgets

The checker reads the production Next build manifest and compressed output. It
fails deterministically above the category threshold and verifies Pagefind and
Shiki are absent from initial route scripts.

| Route/category              | Initial JS raw | Initial JS gzip | Initial scripts | Pagefind initially? | Shiki initially? | Raw/gzip budget     | Result |
| --------------------------- | -------------: | --------------: | --------------: | ------------------- | ---------------- | ------------------- | ------ |
| `/` home                    |        763,050 |         235,928 |              12 | No                  | No               | 900,000 / 285,000   | PASS   |
| `/components` index         |        683,925 |         212,381 |              11 | No                  | No               | 780,000 / 245,000   | PASS   |
| component reference         |        763,619 |         236,124 |              12 | No                  | No               | 900,000 / 285,000   | PASS   |
| `/playground/sticker-trail` |        762,184 |         235,511 |              13 | No                  | No               | 1,020,000 / 320,000 | PASS   |
| `/stickers`                 |        793,321 |         242,198 |              13 | No                  | No               | 900,000 / 285,000   | PASS   |
| `/examples`                 |        621,527 |         192,797 |               9 | No                  | No               | 780,000 / 245,000   | PASS   |
| representative example      |        677,417 |         211,432 |              11 | No                  | No               | 900,000 / 285,000   | PASS   |
| accessibility guide         |        623,121 |         193,552 |               9 | No                  | No               | 780,000 / 245,000   | PASS   |

The home result exactly matches the recorded M16 build (763,050 raw / 235,928
gzip), so M17 introduced no homepage initial-JS regression. Category thresholds
include deliberate headroom for deterministic toolchain variation while still
catching a new client island or eager heavy dependency.

Pagefind 1.5.2 remains local/static and lazy: index 838,010 bytes; runtime
45,555 bytes against 1,250,000 / 52,000 budgets. The Shiki worker is a separate
lazy asset of 173,570 bytes against a 210,000-byte budget and is absent from a
calm guide's initial scripts.

## Packed package probes

These are Vite ESM library probes built from actual tarball-installed packages.
They include React as an external and separately verify excluded component and
official-sticker markers. Existing M11 package/tarball snapshots remain frozen;
M17 adds isolated Cursor and Stack probe budgets only.

| Probe                      |     Raw |   Gzip | Budget raw / gzip | Important included marker | Important excluded markers                       | Result |
| -------------------------- | ------: | -----: | ----------------- | ------------------------- | ------------------------------------------------ | ------ |
| Sticker-only               |   1,731 |    915 | 2,243 / 1,427     | Sticker                   | Navbar, Cursor, Peel, Stack, Trail, sticker pack | PASS   |
| Trail standalone           |  57,982 | 15,399 | 62,591 / 16,640   | Trail engine              | React UI package extras, sticker pack            | PASS   |
| Cursor                     |  56,901 | 15,052 | 61,454 / 16,257   | `sui-sticker-cursor`      | Navbar/Radix, Peel, Stack, Trail, sticker pack   | PASS   |
| Peel                       |  52,457 | 13,672 | 56,550 / 14,762   | `sui-sticker-peel`        | Navbar/Radix, Cursor, Stack, Trail, sticker pack | PASS   |
| Stack                      |  56,649 | 14,758 | 61,181 / 15,939   | `sui-sticker-stack`       | Navbar/Radix, Cursor, Peel, Trail, sticker pack  | PASS   |
| Navbar                     | 120,534 | 31,200 | 129,702 / 33,706  | Navbar/Radix dialog       | Cursor, Peel, Stack, Trail, sticker pack         | PASS   |
| broad Trail representative |  58,621 | 15,640 | 63,281 / 16,899   | React Trail               | Navbar/Radix, Cursor, Peel, Stack, sticker pack  | PASS   |

React and React DOM are not bundled. No probe acquires the official sticker pack
unless explicitly imported. Declarations, declaration maps, source maps, client
directives, exports, SSR imports, packed Next, and packed Vite all pass package
preflight. No M17 test or docs tooling is present in a published tarball.
