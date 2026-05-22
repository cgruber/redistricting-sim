---
id: GAME-085
title: "Composable terrain annotations: replace single terrain type with independent boolean properties"
area: game, rendering, model
status: open
created: 2026-05-21
---

## Summary

The current precinct `terrain` field is a single string (`"coast" | "lakeside" | "foothill" | "riverside"`) assigned by a priority chain. This makes the features mutually exclusive — a precinct adjacent to both a mountain and a lake can only be one type, which is an architectural bug (e.g. combo-6 lakeside at (0,-5) is also adjacent to mountain tile (-1,-5) but cannot express both). Replace it with independent boolean properties so multiple terrain effects can render simultaneously.

## Current State

- `Precinct.terrain?: "coast" | "lakeside" | "riverside" | "foothill"` — single string, priority-ordered in adapter
- Priority: coast > lakeside > foothill > riverside (so foothill + lakeside is impossible)
- `has_internal_lake` exists as a separate boolean but only controls a legacy rendering path
- Scenario JSON and generator both author `"terrain": "lakeside"` explicitly

## Design

### Precinct schema

Replace `terrain` and `has_internal_lake` with:

```
has_lake?: boolean       // water body present in this hex (marsh, shore, or open-water face)
```

`coast`, `foothill`, and `riverside` become **derived-only** — computed by the adapter from tile adjacency and river membership, never stored in JSON. Only `has_lake` is authored (or derived from lake tile adjacency).

### Adapter derivation (replaces priority chain)

```
coast    = any neighbour is a sea tile
foothill = any neighbour is a mountain tile
haslake  = has_lake: true in JSON  OR  any neighbour is a lake tile
riverside = precinct appears in river_edges (and none of above)
```

All four can be simultaneously true on a single precinct. Renderer receives an annotation struct with independent booleans.

### Generator convention

- **Small lake / marsh**: set `has_lake: true` directly on precinct
- **Large lake**: place lake tile(s); adjacent precincts derive `has_lake` automatically — no explicit authoring needed
- **Shore precinct adjacent to mountain**: gets both `has_lake` (derived from lake tile) AND `foothill` (derived from mountain tile) — renders both effects

### Enclosed-precinct rule

A `has_lake: true` precinct whose **all six neighbours** are also water (either `has_lake: true` precincts or lake tiles) is **auto-promoted to a lake tile** at adapter load time — removed from playable precincts, added to terrain tiles. This prevents a fully water-surrounded playable precinct that is visually indistinguishable from open water.

**Island exception**: if the author wants a playable island inside a lake, leave the island precinct with `has_lake: false`. The surrounding lake blobs frame it visually; the island renders as land.

### Typology

| Scenario | Model |
|----------|-------|
| Marsh / pond inside a precinct | `has_lake: true`, land neighbours |
| Small multi-hex lake with shore | ring of `has_lake: true` precincts; open-water center auto-promotes to lake tile at load |
| Large lake (explicit) | lake tile cluster; neighbours derive `has_lake` |
| Island inside a lake | lake tile ring; island precinct has `has_lake: false` |
| Foothill + lakeside simultaneously | `has_lake: true` + mountain-tile neighbour → both render |

## Goals / Acceptance Criteria

**Completed (merged):**
- [x] `Precinct.terrain` field removed from TypeScript types, loader, and adapter
- [x] `Precinct.has_internal_lake` removed (superseded)
- [x] Adapter derives `{ coast, foothill, riverside }` as independent booleans from adjacency (never authored in JSON)
- [x] Renderer applies all applicable terrain effects to a single precinct simultaneously (coast fringe + foothill fringe can coexist)
- [x] Scenario JSON files updated: legacy `terrain` values removed; coast/foothill dropped from JSON output
- [x] `gen-tutorial-003` updated — lake blob precincts removed; lake tile at (7,0) still renders

**Deferred to GAME-086:**
- [ ] Lakeside precinct visual overlay (edge stroke or intrusion shape for precincts adjacent to lake tiles)
- [ ] `has_lake?: boolean` authoring or derived-from-tile-adjacency annotation for lakeside precincts
- [ ] Adapter auto-promotes enclosed `has_lake: true` precincts to lake tiles (enclosed-precinct rule)
- [ ] Island case: `has_lake: false` precinct surrounded by lake tiles renders as land

Note: The metaball lake blob approach was attempted and removed. The lake blob code drove SVG filter/clip complexity that produced visual artifacts at precinct boundaries. GAME-086 will revisit with a simpler design (edge stroke or intrusion, matching coast/foothill pattern).

## Test Coverage

**Completed:**
- [x] Unit test: adapter derives `coast: true` for precinct adjacent to sea tile
- [x] Unit test: adapter derives `foothill: true` for precinct adjacent to mountain tile
- [x] Unit test: precinct adjacent to sea tile AND mountain tile gets both simultaneously
- [x] Unit test: riverside only set when no coast/foothill (exclusive)

**Deferred to GAME-086:**
- [ ] Unit test: adapter derives `lakeside: true` for precinct adjacent to lake tile
- [ ] E2e: tutorial-003 lakeside precinct renders expected visual element

## References

- GAME-082: original terrain visual treatment (where `terrain` priority bug was introduced)
- `game/web/src/model/adapter.ts` lines ~88–106 — current priority chain to replace
- `game/web/src/model/types.ts` line ~71 — `terrain` field to remove
- `game/web/src/model/scenario.ts` lines ~114–126 — `Precinct` interface
