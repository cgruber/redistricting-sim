---
id: DESIGN-008
title: Geographic features — lakes, mountains as decorative non-precinct tiles
area: design, rendering
status: open
created: 2026-04-27
---

## Summary

Add flavor/orientation geographic features (lakes, rivers, hills) to scenario maps as
decorative non-precinct hex tiles. Features are purely cosmetic — they don't participate
in population, simulation, or contiguity — but they:
1. Make maps feel like real places (Civ/SimCity aesthetic)
2. Break up the uniform hex field for player orientation
3. Provide natural "holes" in hex-of-hexes regions (a lake in the center, etc.)

## Design decisions (from 2026-04-27 session)

- Feature tiles colored in grey (mountains/hills) or aqua/teal (lakes/water)
- Animated texture: wave pattern for water, hatching/bump for terrain
- Colors must not overlap with the district color palette (currently 5-8 colors for parties)
- Features block adjacency for contiguity: a precinct separated from its district only
  by a feature tile is NOT contiguous with it (feature = physical barrier)
- Features are static per scenario (not editable by player)

## Scenario format change

Add optional `features` array to scenario JSON:
```json
"features": [
  { "position": { "q": 0, "r": 0 }, "type": "lake" },
  { "position": { "q": 1, "r": -1 }, "type": "lake" },
  { "position": { "q": 0, "r": 2 }, "type": "mountain" }
]
```

Feature types (v1): `lake`, `mountain`. Renderer maps type → color + texture.

## Renderer changes

- Feature tiles rendered as filled hexes with type-specific color + animated texture
  - `lake`: aqua/teal (`#4fa3bf` or similar), animated wave SVG pattern
  - `mountain`: grey (`#8a9bb0` or similar), static hatching
- Feature tiles are NOT `path.hex` elements — use a separate SVG layer below hex layer
- Feature tile positions excluded from neighbor calculation in contiguity BFS

## Loader changes

- Parse optional `features` array; validate positions don't overlap with precinct positions
- Feature positions included in neighbor graph as "blocking" nodes (not passable)

## Goals / Acceptance Criteria

- [ ] Scenario format: optional `features` array with position + type
- [ ] Loader: parses features; validates no overlap with precincts
- [ ] Renderer: feature layer below hex layer; lake = aqua + wave; mountain = grey + hatch
- [ ] Contiguity: feature positions block adjacency (BFS treats them as walls)
- [ ] At least one scenario (new or retrofitted) includes a lake feature
- [ ] e2e: feature tiles visible in map; correct color; don't affect precinct painting

## Out of scope (v1)

- Rivers (linear features spanning edges rather than cells)
- Named features with labels
- Player-visible feature interaction
- Elevation/terrain affecting population density

## References

- GAME-027 — hex-of-hexes shape (implement first; features go inside hex region)
- GAME-028 — backport (coordinate features with backport if adding to old scenarios)
- Visual aesthetic: `thoughts/shared/research/` — Civ/SimCity dark HUD, map-first
