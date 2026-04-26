---
id: GAME-012
title: County border overlay toggle
area: game, rendering
status: open
created: 2026-04-25
---

## Summary

Add a toggle button that shows or hides county boundary lines on the map.
County borders are flavor — they help orient the player geographically but
carry no game mechanic in Sprint 2. The overlay is off by default.

## Current State

`setCountyBordersVisible()` is a no-op stub in `mapRenderer.ts`. County data
is present in the scenario JSON (`county_id` per precinct) but is not rendered.

## Goals / Acceptance Criteria

- [ ] "County borders" toggle button added to the sidebar or toolbar
- [ ] Default state: off (borders not shown on load)
- [ ] When toggled on: county boundary segments rendered as a distinct line
  style (dashed or a different color) that reads as a secondary layer below
  district boundaries
- [ ] When toggled off: county boundary segments hidden
- [ ] Toggle state is not persisted (resets to off on reload)

### County boundary computation
- [ ] County boundary segments computed from `county_id` per precinct: an edge
  between two adjacent precincts is a county boundary if their `county_id`
  values differ
- [ ] Adjacency data from `Precinct.neighbors` used for edge detection
- [ ] Boundary segments computed once at load time (not on every toggle)

### Visual design
- [ ] County borders visually subordinate to district boundaries
- [ ] Readable at all zoom levels (stroke width scales inversely with zoom,
  consistent with GAME-009 zoom implementation)
- [ ] Outer map edges not drawn as county borders (only internal edges where
  two precincts have different `county_id`)

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
