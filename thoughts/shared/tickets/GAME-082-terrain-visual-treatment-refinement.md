---
id: GAME-082
title: Terrain visual treatment refinement — thicker rivers, prominent coast/lakeside edges, foothill rendering
area: game, rendering, UX
status: open
created: 2026-05-19
github_issue: 247
---

## Summary

GAME-075 shipped terrain rendering per DESIGN-008's spec. Manual playthrough of scenario-010
revealed the visual treatment is too subtle: rivers at 2.5px / 70% opacity read as thin threads
rather than as geographic features. Coast and lakeside edges, while present, are similarly
quiet. Foothill rendering was deferred during GAME-075 and is now overdue.

This ticket is a focused visual-tuning pass over the terrain layer. No schema or simulation
changes — just bumping stroke weights, opacities, and possibly adding fills or hatches to make
terrain features read clearly at default zoom and at the partisan-lean view tint.

## Current State

`mapRenderer.ts` constants (all sized in pre-zoom map units):
- `RIVER_BASE_WIDTH = 2.5`, `RIVER_OPACITY = 0.7` — too thin; reads as a hairline
- `TERRAIN_EDGE_BASE_WIDTH = 3`, `TERRAIN_EDGE_OPACITY = 0.9` — coast/lakeside strokes; visible but doesn't read as a shoreline
- `INTERNAL_LAKE_OPACITY = 0.55` — internal-lake ellipse; not yet exercised by any scenario, untested in practice
- Foothill rendering: not implemented (`renderTerrainEdges` matches only `coast` and `lakeside`)
- Terrain tile fills (sea `#3a7fc1`, lake `#4dd0e1`, mountain `#6b7280`) have no stroke around them, so they blend into the SVG background where the boundary isn't a precinct

`HEX_SIZE = 36` px is the precinct radius — a hex edge is ~36 px long. River stroke at 2.5 px ≈ 7% of edge length, which is too thin.

## Goals / Acceptance Criteria

### Rivers

- [ ] River stroke base width bumped to ~5–7 px (target: clearly visible at default zoom without dominating)
- [ ] River opacity bumped to 0.85–0.95 (currently 0.7)
- [ ] River endpoints should not pinch off awkwardly — confirm `stroke-linecap: round` continues to work at the larger width
- [ ] River segments meeting at a shared corner (T-junctions) should join cleanly — assess whether `stroke-linejoin` matters

### Coast / lakeside edges

- [ ] Coast stroke (`COAST_STROKE = #3a7fc1`) base width bumped to ~5 px so the shoreline reads as a coastline, not a faint stripe
- [ ] Lakeside stroke (`LAKESIDE_STROKE = #4dd0e1`) bumped similarly
- [ ] Consider drawing the edge stroke just *inside* the precinct fill (offset toward center) so it reads as a hex edge property rather than a free-floating line at the precinct boundary
- [ ] Verify edges still read clearly when the partisan-lean view changes hex fills to PuOr palette

### Terrain tiles

- [ ] Optional thin border around sea/lake/mountain tile fills so they have a defined boundary against empty SVG background (not against precincts — terrain–precinct boundary is already drawn by district borders)
- [ ] Mountain glyph: currently a single `△` at the tile center; consider 2–3 small triangles to feel more like a ridge (per DESIGN-008's original spec — partially deferred during GAME-075)
- [ ] Sea glyph (`∿`) prominence — verify it's legible at default zoom

### Foothill rendering (deferred from GAME-075)

- [ ] Subtle grey tint or hatched overlay on mountain-facing edges of `foothill` precincts
- [ ] Implementation: extend `renderTerrainEdges` to handle `terrain === "foothill"`, looking up mountain-tile neighbors via the same axial-position map already built for coast/lakeside

### Internal lakes (still untested in real scenarios)

- [ ] Hand-author a 2-precinct lakeside cluster with `has_internal_lake: true` in a test/demo scenario and verify visibility
- [ ] Adjust `INTERNAL_LAKE_OPACITY` / size factors if the ellipses are hard to see against the district fill
- [ ] Defer shared elongated ellipse for adjacent `has_internal_lake` precincts (still tracked from GAME-075 plan)

### Cross-view consistency

- [ ] Terrain treatment readable in both districts view and partisan-lean view
- [ ] Terrain treatment readable when assigned and unassigned hex opacities differ
- [ ] Terrain tiles + river do not visually compete with the district boundary stroke

## Test Coverage

- [ ] e2e: river stroke width attribute matches the new constant at default zoom
- [ ] e2e: coast edge stroke width attribute matches the new constant
- [ ] e2e: `line.terrain-edge-foothill` count matches expected number of mountain-facing edges in scenario-010 (4 north-bank precincts × 1 mountain-facing edge each, roughly — verify)
- [ ] Manual: load scenario-010, eyeball at default zoom + max zoom — terrain features read clearly
- [ ] Manual: switch to partisan-lean view — terrain still distinguishable

## Out of scope

- Animated water (deferred to "post-v1" per DESIGN-008)
- Pixel-accurate visual regression testing (no infra for it)
- New terrain types beyond sea/lake/mountain
- Schema or simulation changes

## References

- DESIGN-008 — original terrain spec (`thoughts/shared/tickets/DESIGN-008-geographic-features.md`)
- GAME-075 resolution (PRs #241–#245) — terrain implementation, ticket retired
- `game/web/src/render/mapRenderer.ts` — all rendering constants live in the `SvgMapRenderer` class
- Scenario-010 — the only scenario that currently exercises terrain features; will need an internal-lake scenario before that AC can be validated
- DESIGN-015 — information-density redesign (related but orthogonal — that's layout, this is rendering)
