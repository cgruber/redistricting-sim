---
id: GAME-012
title: County border overlay toggle
area: game, rendering
status: open
created: 2026-04-25
github_issue: 60
---

## Summary

Add a toggle button that shows or hides county boundary lines on the map.
County borders are flavor — they help orient the player geographically but
carry no game mechanic in Sprint 2. The overlay is off by default.

## Current State

`setCountyBordersVisible()` is a no-op stub in `mapRenderer.ts`. County data
is present in the scenario JSON (`county_id` per precinct) but is not rendered.

## Goals / Acceptance Criteria

- [x] "County borders" toggle button added to toolbar (header controls)
- [x] Default state: off (borders not shown on load); button label: "Show County Borders"
- [x] When toggled on: dashed gray (#a0a0a0) lines at 0.5 opacity, stroke-width 1, dash "4,4"
- [x] When toggled off: county boundary segments hidden; button label: "Hide County Borders"
- [x] Toggle state is not persisted (resets to off on reload)

### County boundary computation
- [x] County boundary segments computed from `county_id` per precinct: edges where county_id differs
- [x] Adjacency data from `Precinct.neighbors` used for edge detection
- [x] Boundary segments computed once at load time (not on every toggle)
- [x] Outer map edges excluded (nId === null → skip)
- [x] Each edge counted once (lower-ID precinct draws the segment)

### Visual design
- [x] County borders visually subordinate to district boundaries (separate `countyBorderGroup`
  layer below district borderGroup; dashed, low opacity)
- [x] `county_id?: string` added to spike Precinct type; adapter.ts populates from scenario
- [NOTE] Zoom-invariant stroke width: will apply automatically when GAME-009 is merged
  (GAME-009's zoom handler scales all `line` elements including county-boundary)

## Test Coverage

### Unit tests
None required — `computeCountySegments` is pure but has no meaningful edge cases beyond what the e2e smoke covers; segment deduplication logic is simple enough to defer.

### E2e tests (`e2e/sprint2.spec.ts`)
- [x] Initial button text is "Show County Borders"
- [x] After click: button text is "Hide County Borders"
- [x] After click: `svg g.county-borders` element is in the DOM (may be empty if scenario has no county_id data)
- [x] After second click: button text returns to "Show County Borders"
- [x] No console errors during toggle

## Notes

- The `setCountyBordersVisible()` stub exists as a method on the renderer
  interface; this ticket implements it.
- County borders are flavor only in Sprint 2. Future scenarios may use county
  boundaries as a game criterion (e.g. "minimize county splits"), but that is
  a content-layer concern, not a rendering concern.
- If GAME-009 (pan/zoom) is not yet merged, coordinate on the zoom-invariant
  stroke width approach.

## References

- `game/web/src/render/mapRenderer.ts` — `setCountyBordersVisible()` stub,
  `renderBoundaries()`
- `game/web/src/model/types.ts` — `Precinct.county_id`
- GAME-009: pan/zoom (zoom-invariant stroke widths)
