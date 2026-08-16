# Scout UI v0.1 Alpha Package Preflight

**Milestone:** 11<br /> **Source baseline:**
`30abbc3d58eefa12266efd772c8d207eed80e419`<br /> **Status:** local alpha freeze;
packages remain unpublished and `private: true`

This document explains the regression numbers enforced by `pnpm test:packages`.
Exact API and package-content inventories live in the machine-readable snapshots
under `tooling/package-preflight/snapshots/`.

## Method

The preflight deletes only generated `dist` directories and package-local
TypeScript build markers, bypasses the Turbo cache, rebuilds in dependency
order, and creates real `pnpm pack` tarballs. It installs those tarballs in
isolated copies of the Next.js and Vite fixtures outside the pnpm workspace
graph. No fixture imports workspace source.

Package metrics distinguish compressed npm tarball bytes from unpacked shipped
bytes. Vite probe metrics distinguish raw JavaScript from deterministic gzip
bytes. These are regression baselines for this repository and toolchain, not
claims about the final size of every consumer application.

Declaration maps embed their referenced TypeScript source so they remain useful
outside the monorepo without shipping editable `src` trees. This intentionally
increases map bytes relative to the approved M10 artifacts.

## Approved M10 reference measurements

The first M11 audit measured the untouched M10 artifacts before README, map, or
preflight changes:

| Artifact                  | Packed/raw bytes | Gzip bytes |
| ------------------------- | ---------------: | ---------: |
| `@scout-ui/react` tarball |          103,034 |        n/a |
| Trail tarball             |           35,086 |        n/a |
| Stickers tarball          |           26,038 |        n/a |
| Sticker-only Vite probe   |           44,481 |     11,418 |
| Navbar Vite probe         |          120,558 |     31,214 |
| Navbar incremental cost   |           76,077 |     19,796 |

## Frozen M11 package baselines

| Package                   |  Packed | Unpacked |      JS |    CSS | Assets | Files | Packed budget | Unpacked budget |
| ------------------------- | ------: | -------: | ------: | -----: | -----: | ----: | ------------: | --------------: |
| `@scout-ui/react`         | 108,311 |  493,329 | 114,584 | 74,665 |      0 |    88 |       116,976 |         532,796 |
| `@scout-ui/sticker-trail` |  38,726 |  141,318 |  36,725 |  2,805 |      0 |    40 |        41,825 |         152,624 |
| `@scout-ui/stickers`      |  26,944 |  202,576 |  29,898 |      0 | 15,588 |   149 |        29,100 |         218,783 |

All values are bytes. Budgets add eight percent maintenance headroom, with a
small minimum allowance for package metadata. Maps, types, licenses, and
required attribution are never removed merely to meet a budget.

## Frozen M11 Vite probes

| Probe                               | Raw bytes | Gzip bytes | Raw budget | Gzip budget |
| ----------------------------------- | --------: | ---------: | ---------: | ----------: |
| Sticker through broad React root    |    44,417 |     11,417 |     47,971 |      12,331 |
| Peel through broad React root       |    52,361 |     13,668 |     56,550 |      14,762 |
| Navbar explicit leaf                |   120,094 |     31,209 |    129,702 |      33,706 |
| Navbar incremental over Sticker     |    75,677 |     19,792 |     81,732 |      21,376 |
| Trail through broad React root      |    58,593 |     15,647 |     63,281 |      16,899 |
| Standalone Trail                    |    57,954 |     15,407 |     62,591 |      16,640 |
| One direct sticker definition/asset |     1,731 |        915 |      2,243 |       1,427 |

The Sticker-only probe must contain no Navbar, Ribbon, scroll-progress, Radix
Dialog, Cursor, Peel, Stack, Trail, or official sticker-pack implementation
markers. The Navbar probe deliberately retains Radix Dialog `1.1.23`; its cost
is documented rather than hidden.

## Updating the freeze

After M11, a public contract change requires this sequence:

1. update the authoritative specification;
2. update implementation and packed fixtures;
3. add a Changeset describing release and migration intent;
4. review package/API/content and size changes;
5. run `pnpm test:packages:update` intentionally;
6. rerun `pnpm test:packages` without update mode.

Unsupported deep imports through `src`, `dist`, or implementation files are not
part of the freeze.
