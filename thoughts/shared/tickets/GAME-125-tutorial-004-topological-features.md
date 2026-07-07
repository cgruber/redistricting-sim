---
id: GAME-125
title: Tutorial-004 topological features — NW mountains, SE/south coastline, mountains→sea river
area: game, content, rendering
status: open
created: 2026-07-06
---

## Summary

Give tutorial-004 ("Fairhaven: Putting It Together", the capstone) its full topographic frame,
per the 2026-07-06 owner request: a mountain range on the NORTH-WEST rim, an ocean on the
SOUTH-EAST rim curling around the south vertex, and the river re-routed to flow OUT OF the
mountains and into that sea. Features hug the rim ("on the edge, not floating outside the
circle"). Terrain stays cosmetic — the tutorial's four-wedge balance lesson must survive.

Because this is the FIRST shipped scenario to place terrain tiles, it also surfaced a latent
map-fit bug: the renderer sized the auto-fit to precinct centers only, so rim-framing tiles (one
ring outside the precinct circle) clipped against the overflow-hidden container with no way to
zoom out.

## Current State

Implemented on this branch (pending owner eyeball on serve-local + merge):

- **Content** (`tutorial-004.spec.yaml` → regenerated `tutorial-004.json`): 8 `mountain` tiles on
  the NW frame (`q+r=-7`), 10 `sea` tiles on the SE frame (`q+r=+7`) + a 2-tile curl west of the
  south vertex (`r=7`); river re-routed NW-rim → south vertex; `population.terrain_weights` pinned
  to 1.0 (cosmetic — defaults would halve the NW wedge / thin the SE wedge and break balance);
  party `color` fields authored in the spec (GAME-043 had them in the JSON only) so regen keeps them.
- **Renderer**: `mapBounds(precincts, extraCenters=[])` folds terrain-tile centers into the fit;
  `initZoom` passes them. Backward compatible, one production caller, new unit tests.
- **Tests**: `hex-geometry_test` green; new `e2e/tutorial-004-terrain.spec.ts` (terrain-render smoke
  + four-wedge winnability via `__gameStore`) — the first e2e to pin T4 winnability. Full
  `//game/web:e2e_test` green.
- **Verified live** (serve-local debug deep-link): mountains frame the NW, ocean the SE+south, river
  flows mountains→sea, whole framed map in view (no clip), county borders clean, zero console errors.
  Winnability also proven offline (crude equal-angle wedges: all within 10.5%, all contiguous).

## Goals / acceptance criteria

- [x] Mountains frame the NW rim; ocean frames the SE rim + curls over the south vertex.
- [x] River flows from the mountains to the sea.
- [x] Terrain cosmetic — four-wedge balance (±15%) + contiguity still achievable (verified).
- [x] Terrain tiles render and stay fully in view (map-fit includes them).
- [x] Zero console errors; first-terrain-scenario rendering guarded by an e2e.
- [ ] Owner eyeball on serve-local (full vs. half NW mountains is an easy tweak).

## References

- Owner request: 2026-07-06 tutorial-004 topological features.
- Content: `game/scenarios/tutorial-004.spec.yaml`, `game/scenarios/tutorial-004.json`.
- Renderer: `game/web/src/model/hex-geometry.ts` (`mapBounds`), `game/web/src/render/mapRenderer.ts`.
- Tests: `game/web/src/model/hex-geometry_test.ts`, `game/web/e2e/tutorial-004-terrain.spec.ts`.
- Related: GAME-100 (river routing), GAME-084 (terrain tiles), GAME-043 (party colors),
  GAME-099 (T4 pipeline), DESIGN-008 (terrain rendering).
