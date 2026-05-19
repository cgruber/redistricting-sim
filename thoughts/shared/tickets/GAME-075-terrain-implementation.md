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

### Schema (loader.ts) — PR1 #241 (merged)

- [x] `terrain_tiles` array in scenario JSON: `{ position: {q,r}, type: "sea"|"lake"|"mountain" }`
- [x] `river_edges` array: pairs of adjacent precinct IDs `[["p001","p002"], ...]`
- [x] `river_blocks_contiguity` boolean field (default: `false`)
- [x] Precinct-level `terrain` field: `"coast"|"lakeside"|"riverside"|"foothill"` (optional; derived if absent)
- [x] Precinct-level `has_internal_lake` boolean (default: `false`)
- [x] Loader derives annotations from adjacency when not explicitly authored; explicit values override
- [x] Loader validates: no terrain tile position overlaps precinct position
- [x] Loader rejects: `lake` tile adjacent to `sea` tile
- [x] Loader rejects: precinct fully enclosed by mountain tiles (BFS reachability from map boundary)
- [ ] N/A — Loader warns (non-fatal): lake + sea present without a connecting river path — deferred; no scenario yet exercises this path, and `lake` + `sea` validation already prevents the trivial adjacency case
- [x] Plus: loader rejects `river_edges` pair that is not geometrically adjacent (added per PR1 critique)
- [x] Plus: loader rejects `terrain_tiles` / `river_edges` when `geometry.type === "custom"` (added per PR1 critique)

### Renderer (mapRenderer.ts / main.ts) — PR2 #242 (merged)

- [x] Terrain tile layer rendered below precinct hex layer (separate SVG group)
- [x] `sea`: fill `#3a7fc1`, `∿` wave glyph centered
- [x] `lake`: fill `#4dd0e1`, glyph omitted (white-on-aqua contrast issue; DESIGN-008 allows omitting)
- [x] `mountain`: fill `#6b7280`, `△` glyph centered
- [x] Terrain tiles not interactive (no hover, no click, no district assignment affordance)
- [x] Coast precincts: distinct stroke on sea-facing edge(s)
- [x] Lakeside precincts: distinct stroke on lake-facing edge(s); if `has_internal_lake: true`,
      render small aqua ellipse (~55%/45% of HEX_SIZE) within the hex fill
- [ ] N/A — Two adjacent `has_internal_lake` precincts: shared elongated ellipse bridging both — deferred per plan; one ellipse per precinct is sufficient v1
- [x] Rivers: blue stroke `#38bdf8` ~2.5px 70% opacity along river edges, layer above precinct
      fills; edge coordinates derived from shared hex corners via `hexCorners()`
- [ ] N/A — Foothill precincts: subtle grey tint on mountain-facing edges — deferred per plan (nice-to-have)

### Contiguity (simulation/evaluate.ts or loader.ts) — PR3 #243 (merged)

- [x] Terrain tile positions excluded from adjacency graph (non-passable nodes) — terrain tile positions are never in `posMap` so adapter-built `neighbors`/`passableNeighbors` cannot point at them
- [x] When `river_blocks_contiguity: true`: river edge pairs removed from adjacency graph (via `passableNeighbors` populated in adapter; BFS reads it via `p.passableNeighbors ?? p.neighbors`)
- [x] Existing contiguity BFS behavior unchanged for scenarios with no terrain fields — `passableNeighbors` mirrors `neighbors` when not blocking; legacy/test precincts without `passableNeighbors` fall back to `neighbors`

### Population gradient (generator) — DEFERRED to GAME-078

- [ ] POST-MERGE: distance-weighted generator deferred to GAME-078 (VRA scenarios), the authorized off-ramp per this ticket's "Coordinate with DESIGN-013 / GAME-078" note. The demo scenario in PR4 uses a simple uniform-population layout sufficient to exercise terrain mechanics; principled gradients become part of the VRA-scenario authoring pipeline.

### New scenario — PR4 (this PR)

- [x] At least one new scenario authored using terrain features: sea/coast, mountain ridge,
      and river — `scenario-010` "Two Banks, One River" (16 precincts, 2 mountain + 3 sea terrain tiles, 7 river edges with `river_blocks_contiguity: true`)
- [ ] N/A — Scenario uses realistic population gradient — deferred with the generator AC above
- [x] Coordinate with DESIGN-013 / GAME-078 — terrain showcase available standalone; VRA scenarios may use the same mechanics

## Test Coverage

- [x] Unit: loader rejects terrain tile overlapping precinct position
- [x] Unit: loader rejects lake tile adjacent to sea tile
- [x] Unit: BFS enclosed-precinct validation correctly identifies invalid mountain enclosure
- [x] Unit: river edges removed from adjacency graph when `river_blocks_contiguity: true`
- [x] Unit: derived coast annotation correct for precinct adjacent to sea tile
- [x] e2e: terrain tiles visible on map (sea blue, lake aqua, mountain grey)
- [x] e2e: terrain tiles not paintable (click on sea tile → no district change)
- [x] e2e: river stroke visible between two designated precincts

## References

- DESIGN-008 — full terrain spec (read before implementing)
- `game/web/src/model/hex-geometry.ts` — `hexCorners()` for edge coordinate calculation
- `game/web/src/simulation/loader.ts` — schema + validation
- `game/web/src/main.ts` / `mapRenderer.ts` — rendering layers
- DESIGN-013 / GAME-078 — VRA scenarios that consume terrain features
