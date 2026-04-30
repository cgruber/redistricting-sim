---
id: GAME-038
title: Extract DOM panel renderers out of mapRenderer.ts
area: game, code-quality
status: resolved
created: 2026-04-29
---

## Summary

`render/mapRenderer.ts` ends with four standalone functions — `renderResults`,
`renderLegend`, `renderDistrictButtons`, and `renderValidityPanel` — that build raw HTML
strings for DOM panels outside the SVG canvas. They do not belong in the SVG renderer
module; they are presentation logic for sidebar and overlay elements. Extract them to a
dedicated `render/panels.ts` module.

## Current State

`mapRenderer.ts` is 718 lines. The four panel functions at lines ~608–718 each build
`innerHTML`-style HTML strings for DOM elements that are structurally separate from the
D3 SVG. Any future panel work requires editing the renderer file.

## Goals / Acceptance Criteria

- [ ] New file `game/web/src/render/panels.ts` contains `renderResults`, `renderLegend`,
  `renderDistrictButtons`, `renderValidityPanel`
- [ ] `mapRenderer.ts` imports the panel functions from `panels.ts` (if it calls them) or
  call-sites in `main.ts` are updated to import from `panels.ts` directly
- [ ] `mapRenderer.ts` reduced by ~110 lines with no behavior change
- [ ] `ts_library` target for `panels.ts` added to `game/web/src/render/BUILD.bazel`
- [ ] `bazel build //game/web/...` and full e2e suite pass

## Test Coverage

No new unit tests required — panel functions build HTML strings for DOM; covered by
existing Playwright e2e tests that assert visible panel content.

## References

- `game/web/src/render/mapRenderer.ts` lines ~608–718
- `game/web/src/main.ts` (call-sites for panel functions)
- `game/web/src/render/BUILD.bazel`
