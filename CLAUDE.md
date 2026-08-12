# Scout UI — Claude Code Instructions

Scout UI is an existing, specification-driven open-source React library.

Do not redesign the project architecture from scratch.

## Authoritative documents

Before implementing any milestone, read:

1. SCOUT_UI_MASTER_SPEC.md
2. SCOUT_UI_DESIGN_SYSTEM.md
3. SCOUT_UI_ENGINEERING_SPEC.md
4. IMPLEMENTATION_PLAN.md

These are the source of truth.

If implementation requires changing a public API, architecture, accessibility
policy, performance model, package structure, or visual contract, update the
authoritative specifications first.

## Repository boundaries

This repository is:

scout-ui/

The sibling repository:

../scout-in

is READ-ONLY reference material.

Never modify, move, format, delete, or commit files inside ../scout-in.

Do not copy protected Scout assets into Scout UI.

## Current package architecture

Public packages:

- @scout-ui/react
- @scout-ui/sticker-trail
- @scout-ui/stickers

Do not add another public package during v0.1.

@scout-ui/stickers must remain completely React-free.

## React / RSC rules

Use the smallest necessary Client Component boundary.

Do not mark the entire @scout-ui/react package "use client".

Server-compatible leaves remain unmarked.

Interactive leaves use "use client" only where genuinely required.

React and React DOM remain peer dependencies and must not be bundled.

## Styling

Scout UI does not require:

- Tailwind
- CSS-in-JS
- Framer Motion
- a JavaScript theme provider

Use the existing CSS token system, `--sui-*` variables, `sui-*` classes, and
cascade layers.

## Performance

High-frequency pointer or drag coordinates must not cause React state updates
per pointer movement.

Use refs, imperative engines, requestAnimationFrame, CSS variables, transforms,
opacity, fixed pools, and bounded work where appropriate.

## Accessibility

Accessibility is part of component completion.

Always preserve:

- semantic native elements
- keyboard alternatives
- visible focus
- reduced motion
- forced colors
- touch/coarse-pointer behavior
- zoom/reflow
- screen-reader semantics

## Verification

Never rely only on workspace imports.

Public package behavior must be verified using the existing packed tarball
consumer harness with Next.js and Vite fixtures.

Do not weaken tests merely to make a milestone pass.

## Milestone workflow

Implement one milestone at a time.

Do not start the next milestone until explicitly instructed.

At milestone completion:

- run all acceptance criteria
- run relevant root checks
- report PASS/FAIL individually
- report git diff/stat
- leave milestone changes uncommitted unless explicitly instructed
- STOP
