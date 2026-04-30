---
id: GAME-046
title: Unit tests for render/panels.ts
area: game, code-quality, testing
status: open
created: 2026-04-29
---

## Summary

`render/panels.ts` (extracted in GAME-038) contains four HTML-string-generating
functions: `renderResults`, `renderLegend`, `renderDistrictButtons`, and
`renderValidityPanel`. These build DOM content for game sidebars and overlays.
They currently have no unit tests; coverage is through e2e only.

Two approaches exist for unit testing them:
1. **jsdom** — install `jsdom` as a dev dependency; call functions against a
   real DOM implementation; assert element presence and text content.
2. **Extract pure helpers** — refactor each function to a pure `buildXxxHtml()`
   string-builder, test the strings directly; keep the DOM-mutation wrapper
   thin and untested.

This ticket is deferred until after Sprint 11 design work lands. Implement
whichever approach is chosen during Sprint 11 triage.

## Current State

`render/panels.ts` has no unit tests. All coverage is via Playwright e2e tests
that assert visible panel content (sidebar text, district buttons, legend labels).
The e2e coverage is reasonable but does not catch HTML structure regressions in
isolation.

## Goals / Acceptance Criteria

- [ ] Choose approach (jsdom or pure extract) during Sprint 11 triage
- [ ] `game/web/src/render/panels_test.ts` created with TAP-runner tests
- [ ] Tests cover all four functions: `renderResults`, `renderLegend`,
  `renderDistrictButtons`, `renderValidityPanel`
- [ ] Each function has: happy-path structural check, at least one
  boundary/edge-case check
- [ ] Bazel targets added; `bazel test //web/...` passes

## Test Coverage

All AC items above are the test requirements.

## References

- `game/web/src/render/panels.ts`
- `game/web/src/render/BUILD.bazel` (does not exist yet — render/ has no BUILD.bazel)
- Option A (jsdom): https://github.com/jsdom/jsdom
- Option B (extract pure helpers): refactor each function so HTML building is
  separate from DOM mutation — no external deps needed
