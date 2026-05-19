---
id: GAME-075
title: Terrain implementation — tiles, edge rivers, precinct annotations, renderer
area: game, rendering, content
status: open
created: 2026-05-18
---

## Summary

Implement the terrain system specified in DESIGN-008: non-precinct terrain tiles (sea, lake,
mountain), precinct terrain annotations (coast, lakeside, riverside, foothill), edge-based
rivers, symbolic rendering for all terrain types, map validity rules, and population-gradient
generator support. Deliver at least one new scenario that exercises terrain features.

## Current State

Scenario JSON has no terrain support. The hex renderer draws precincts only; contiguity BFS
operates on precinct adjacency with no concept of terrain barriers or river edges.

## Goals / Acceptance Criteria

### Schema (loader.ts)

- [ ] `terrain_tiles` array in scenario JSON: `{ position: {q,r}, type: "sea"|"lake"|"mountain" }`
- [ ] `river_edges` array: pairs of adjacent precinct IDs `[["p001","p002"], ...]`
- [ ] `river_blocks_contiguity` boolean field (default: `false`)
- [ ] Precinct-level `terrain` field: `"coast"|"lakeside"|"riverside"|"foothill"` (optional; derived if absent)
- [ ] Precinct-level `has_internal_lake` boolean (default: `false`)
- [ ] Loader derives annotations from adjacency when not explicitly authored; explicit values override
- [ ] Loader validates: no terrain tile position overlaps precinct position
- [ ] Loader rejects: `lake` tile adjacent to `sea` tile
- [ ] Loader rejects: precinct fully enclosed by mountain tiles (BFS reachability from map boundary)
- [ ] Loader warns (non-fatal): lake + sea present without a connecting river path

### Renderer (mapRenderer.ts / main.ts)

- [ ] Terrain tile layer rendered below precinct hex layer (separate SVG group)
- [ ] `sea`: fill `#3a7fc1`, optional `∿` wave glyph centered
- [ ] `lake`: fill `#4dd0e1`, optional small wave glyph
- [ ] `mountain`: fill `#6b7280`, two or three `△` glyphs centered
- [ ] Terrain tiles not interactive (no hover, no click, no district assignment affordance)
- [ ] Coast precincts: distinct stroke on sea-facing edge(s)
- [ ] Lakeside precincts: distinct stroke on lake-facing edge(s); if `has_internal_lake: true`,
      render small aqua ellipse (~40% hex area) within the hex fill
- [ ] Two adjacent `has_internal_lake` precincts: shared elongated ellipse bridging both
- [ ] Rivers: blue stroke `#38bdf8` ~2–3px 70% opacity along river edges, layer above precinct
      fills; edge coordinates derived from shared hex corners via `hexCorners()`
- [ ] Foothill precincts: subtle grey tint on mountain-facing edges (nice-to-have; skip if time)

### Contiguity (simulation/evaluate.ts or loader.ts)

- [ ] Terrain tile positions excluded from adjacency graph (non-passable nodes)
- [ ] When `river_blocks_contiguity: true`: river edge pairs removed from adjacency graph
- [ ] Existing contiguity BFS behavior unchanged for scenarios with no terrain fields

### Population gradient (generator)

- [ ] Generator updated with distance-weighted population assignment from a designated urban center
- [ ] New terrain-based scenarios use this generator (existing scenarios untouched)

### New scenario

- [ ] At least one new scenario authored using terrain features: sea/coast, mountain ridge,
      and/or river
- [ ] Scenario uses realistic population gradient (urban cluster, sparse highlands/coast)
- [ ] Coordinate with DESIGN-013 / GAME-078 — VRA scenarios may serve as the terrain showcase

## Test Coverage

- [ ] Unit: loader rejects terrain tile overlapping precinct position
- [ ] Unit: loader rejects lake tile adjacent to sea tile
- [ ] Unit: BFS enclosed-precinct validation correctly identifies invalid mountain enclosure
- [ ] Unit: river edges removed from adjacency graph when `river_blocks_contiguity: true`
- [ ] Unit: derived coast annotation correct for precinct adjacent to sea tile
- [ ] e2e: terrain tiles visible on map (sea blue, lake aqua, mountain grey)
- [ ] e2e: terrain tiles not paintable (click on sea tile → no district change)
- [ ] e2e: river stroke visible between two designated precincts

## References

- DESIGN-008 — full terrain spec (read before implementing)
- `game/web/src/model/hex-geometry.ts` — `hexCorners()` for edge coordinate calculation
- `game/web/src/simulation/loader.ts` — schema + validation
- `game/web/src/main.ts` / `mapRenderer.ts` — rendering layers
- DESIGN-013 / GAME-078 — VRA scenarios that consume terrain features
