---
id: GAME-086
title: Lake rendering — precinct-level lake overlay with proper visual design
area: game, rendering, UX
status: open
created: 2026-05-21
---

## Summary

GAME-085 introduced composable terrain annotations. A `has_lake` precinct property was also implemented, driving a metaball SVG overlay for precincts adjacent to bodies of water. The metaball approach (Gaussian blur + feColorMatrix threshold) produced merged organic blobs for connected lake clusters, but the visual failed in two ways: (1) the blob hard-stopped at non-lake precinct boundaries with no graceful pullback, and (2) every attempted fix (negative repulsors, clip path inset, bezier crinkle) introduced new artifacts (cats-eye gaps, circular cuts, uneven crinkle). The lake blob code was removed in GAME-085 cleanup rather than shipped in a broken state.

Lake *tiles* (type="lake" in terrain_tiles) still render as aqua hexagons. What is missing is any visual indication on *precincts* that they border a lake — the "lakeside" annotation that coast and foothill precincts get for sea and mountain adjacency.

## Current State

- Lake terrain tiles render as aqua hex fills (correct; no change needed).
- `has_lake` precinct field: removed from schema, loader, adapter, and all scenario files.
- `hasLake` TerrainAnnotation flag: removed from types, adapter, renderer.
- No lake-specific precinct overlay renders at all.
- The `tutorial-003` scenario still has a lake tile at (7,0); the adjacent precinct (6,0) has no visual indication of lakeside status beyond seeing the tile itself.

## Goals / Acceptance Criteria

- [ ] Design: decide visual language for lakeside precincts — edge stroke, fill tint, or intrusion shape consistent with coast/foothill treatment
- [ ] Derive lakeside annotation from adjacency to lake tiles (no authored `has_lake` field — mirror the coast/foothill approach)
- [ ] Render lakeside visual on precincts adjacent to lake tiles
- [ ] For multi-precinct lake clusters (precincts sharing a lake-adjacent edge), decide whether merged visuals are needed or per-precinct treatment suffices
- [ ] tutorial-003 updated to demonstrate at least one lakeside precinct
- [ ] E2E tests cover the lakeside rendering

## Test Coverage

- [ ] Unit: adapter correctly derives `lakeside: true` for precincts adjacent to lake tiles
- [ ] Unit: precincts not adjacent to lake tiles have `lakeside: false` (or annotation absent)
- [ ] E2E: tutorial-003 lakeside precinct(s) render with expected visual element

## References

- GAME-085: composable terrain annotations (parent ticket; lake removed here)
- `game/web/src/render/mapRenderer.ts` — `renderTerrainEdges()` is the reference implementation for coast/foothill intrusion rendering; lakeside should follow the same pattern
- `game/web/src/model/adapter.ts` — terrain annotation derivation; add `lake` adjacency check alongside `sea`/`mountain`
- Removed lake blob code: see git history for the `renderLakeBlobs` method if metaball approach is reconsidered
