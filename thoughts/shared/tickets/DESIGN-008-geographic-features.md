---
id: DESIGN-008
title: Geographic features — terrain tiles, edge rivers, precinct annotations, symbolic rendering
area: design, rendering
status: open
created: 2026-04-27
last_updated: 2026-05-18
---

## Summary

Full terrain model for scenario maps: non-precinct terrain tiles (sea, lake, mountain),
precinct terrain annotations (coast, lakeside, riverside, foothill), and edge-based rivers.
Together these make maps feel geographically plausible — urban clusters near coasts,
population thinning toward highlands, natural district boundaries along rivers — without
requiring painterly rendering. Style is symbolic (Civ/SimCity: solid fills + simple glyphs),
consistent with the game's dark strategy-game aesthetic.

This ticket covers the design spec. Implementation is GAME-075.

---

## Terrain model

### Non-precinct tiles (zero pop, non-assignable, block contiguity)

| Type | Description | Constraints |
|------|-------------|-------------|
| `sea` | Open ocean, map perimeter | Never adjacent to `lake` tile |
| `lake` | Inland water body | Surrounded only by `lakeside` precincts or other `lake` tiles; lake tiles and sea tiles must have at least one precinct between them; if map also has `sea`, at least one river must connect them |
| `mountain` | Highland ridge | Never fully encloses a precinct; use elongated ridge shapes, not circular blobs |

### Precinct annotations (assignable, reduced population, visual treatment)

| Annotation | Derivation | Notes |
|------------|------------|-------|
| `coast` | Derived: adjacent to `sea` tile(s) | Shoreline treatment on sea-facing edges |
| `lakeside` | Derived: adjacent to `lake` tile(s), OR explicitly authored | Explicit flag for small internal lakes (no separate tile needed) |
| `riverside` | Derived: adjacent to `river` edge(s) | |
| `foothill` | Derived: adjacent to `mountain` tile(s) | Never fully enclosed by mountain tiles |

Population for annotated precincts is authored lower in scenario JSON — the engine does not
enforce a specific reduction, just applies the visual treatment. Realistic gradients are an
authoring concern, not an engine rule.

### Edge features

**River**: flows along hex edges (Civ-style), not tiles. Valid endpoints: lake tile edge,
sea tile edge, mountain tile edge, map boundary. If both `lake` and `sea` exist on a map,
at least one river must connect them. Rivers cannot cross mountain tiles.

Rivers can source at mountains and drain to lakes; a second river can connect lake to sea.
River-through-lake-to-sea chains are valid (mountain → lake → river → sea).

Scenario JSON: `"river_edges": [["p001","p002"],["p002","p003"]]` — each pair is two
adjacent precinct IDs with a river flowing along their shared edge.

Per-scenario control: `"river_blocks_contiguity": true` removes river-edge pairs from the
contiguity BFS, making the river a hard district boundary. Default: `false` (bridgeable).

---

## Map validity rules

1. No `lake` tile adjacent to a `sea` tile (minimum one precinct buffer between them)
2. Lake + sea both present on map → at least one river must connect them
3. No precinct fully enclosed by mountain tiles — BFS from map boundary through non-mountain
   tiles must reach every precinct
4. River endpoints must be a lake tile edge, sea tile edge, mountain tile edge, or map boundary
5. No `lake` tile adjacent to a plain land precinct (must be surrounded by `lakeside` precincts
   or other `lake` tiles only)

---

## Symbolic rendering spec

### Terrain tiles

| Type | Fill | Glyph | Notes |
|------|------|-------|-------|
| `sea` | `#3a7fc1` (ocean blue) | Optional `∿` wave centered | Dark; readable against district fills |
| `lake` | `#4dd0e1` (aqua) | Optional small wave or none | Lighter than sea; clearly distinguishable |
| `mountain` | `#6b7280` (slate grey) | 2–3 `△` glyphs centered | No animation; static glyphs sufficient |

All terrain tiles rendered on a dedicated SVG layer **below** the precinct hex layer. Terrain
tile positions carry no `path.hex` element and are not interactive.

### Precinct annotations (additional rendering on normal precincts)

- **Coast**: distinct stroke color or thicker stroke on sea-facing edges (shoreline indicator)
- **Lakeside**: same treatment on lake-facing edges; if `has_internal_lake: true`, render a
  small aqua ellipse (~40% of hex area) centered within the hex fill
- **Riverside**: blue river stroke along river edge(s) — handled by the river layer (see below)
- **Foothill**: subtle grey tint or light hatch on mountain-facing edges (nice-to-have; may defer
  to post-S13 if implementation time is tight)

### Rivers

Blue stroke along the computed hex edge: `#38bdf8`, ~2–3px, 70% opacity. Drawn on a layer
**above** precinct hex fills but **below** district outlines. `hexCorners()` in
`hex-geometry.ts` gives exact pixel coordinates for each corner pair; the shared edge between
two hexes is the line segment between the two corners they share.

### Internal lakes (small lake within a single precinct)

When `has_internal_lake: true` on a `lakeside` precinct, render a simple aqua ellipse
(~40% hex area) centered within the hex. Two adjacent `has_internal_lake` precincts render a
shared elongated ellipse bridging both hexes. Three–four adjacent ones form an obloid shape
spanning the cluster.

---

## Scenario format changes

### Top-level additions

```json
{
  "terrain_tiles": [
    { "position": { "q": 0, "r": 0 }, "type": "sea" },
    { "position": { "q": 2, "r": -1 }, "type": "mountain" },
    { "position": { "q": 4, "r":  1 }, "type": "lake" }
  ],
  "river_edges": [
    ["p012", "p013"],
    ["p013", "p019"]
  ],
  "river_blocks_contiguity": false
}
```

### Precinct-level additions

```json
{
  "id": "p011",
  "terrain": "lakeside",
  "has_internal_lake": false,
  "population": 340
}
```

`terrain` on a precinct is optional. Derived annotations (coast, lakeside, riverside,
foothill) can be computed from adjacency at load time. The loader should accept explicit
values as overrides and prefer them over derivation.

---

## Population gradient approach

Population realism is achieved through scenario authoring, not engine rules. For new scenarios:

- Designate one or more urban center hexes in the generator
- Assign population by distance decay: precincts near urban centers get higher population;
  precincts near terrain tiles (mountain, sea, lake edges) get lower population
- Coastal, lakeside, riverside, and foothill precincts are authored with reduced population
  reflecting partial land area or topographic constraints

Existing scenarios are **not** retroactively normalized. New terrain-based scenarios get
realistic gradients from authoring.

---

## Authoring guidelines

- **Mountain shapes**: use elongated ridge forms (length >> width). Circular mountain clusters
  read as volcanoes and disorienting. The enclosed-precinct BFS rule catches the degenerate case.
- **Lake placement**: lake tiles must be surrounded by lakeside precincts; a lake tile that
  would touch open land or sea directly is invalid and the loader should reject it.
- **River paths**: each pair in `river_edges` must be genuinely adjacent in the hex grid.
  Rivers should follow geographic logic (flow downhill from mountains to sea/lake).

---

## Future: Map Editor Behavior (not S13 scope)

When a map editor is built, lakeside placement should follow these auto-conversion rules:

- Single isolated `lakeside` precinct → renders internal lake within hex (`has_internal_lake: true`)
- Two adjacent `lakeside` precincts → shared internal lake stretching between them
- Three–four adjacent `lakeside` precincts → obloid lake spanning the cluster
- `lakeside` precinct with all 6 neighbors being `lakeside` or `lake` tiles → auto-converts
  to a `lake` tile (non-precinct, zero pop)

River placement: plopping a river segment on a hex edge sets `river_edges` for that pair.
Dragging a path auto-chains segments.

---

## Goals / Acceptance Criteria

- [ ] Terrain model spec finalized (this document) — reviewed before GAME-075 starts
- [ ] JSON schema additions documented: `terrain_tiles`, `river_edges`, `river_blocks_contiguity`,
      precinct `terrain` and `has_internal_lake` fields
- [ ] Rendering spec finalized: colors, glyphs, river stroke, internal lake ellipse
- [ ] Map validity rules documented and ready for implementation
- [ ] At least one new scenario designed using terrain features (for GAME-075 implementation test)

## Out of scope (this ticket)

- Implementation (GAME-075)
- Editor auto-conversion behaviors (documented above for future reference only)
- Animated water textures (static symbolic rendering sufficient for v1)
- Elevation affecting gameplay criteria (population gradient is authoring only)
- Foothill visual rendering is nice-to-have; implement in GAME-075 if time allows
- Named features with labels
- Estuaries (lake + sea adjacency forbidden; model as sea tiles extending inland or use river)

---

## References

- GAME-075 — terrain implementation (trails this)
- DESIGN-013 / GAME-078 — VRA scenarios that use terrain features
- `game/web/src/model/hex-geometry.ts` — `hexCorners()` for edge coordinate computation
- Visual aesthetic: `thoughts/shared/vision/game-vision.compressed.md`
- 2026-05-18 design session — full terrain model discussion
