---
id: GAME-127
title: Terrain confined to the r=n boundary (generator invariant) + tutorial-004 rim re-author
area: game (map generation + content)
status: resolved
created: 2026-07-07
---

## Summary

The terrain generator currently **requires** cosmetic terrain (mountain / sea / lake)
to be placed **outside** the playable hex circle: `buildTerrainTiles` throws if a tile
overlaps a precinct, and off-grid tiles are "intentionally allowed." tutorial-004
exploits this — its 18 terrain tiles sit at `hexDist 7`, one ring beyond the radius-6
map, so the mountains and ocean float *outside* the r=6 circle rather than being part
of the map.

Flip the invariant so terrain lives **inside** the boundary and **replaces** the
precinct on its cell, then re-author tutorial-004 so its mountains + ocean occupy the
outer ring of the r=6 map (the terrain becomes part of the map instead of framing it).

Player intent (verbatim): *"the mountains and the ocean are outside that — I want those
to be part of the r-7 map … every mountain goes down one … every ocean goes up …
The regular precincts taken up by these newly moved geo features are just gone …
In general, the generator should not generate any terrain (precinct, mountain, lake, or
ocean) outside of the r=n boundary."*

(Note: player counts 7 rings incl. center = radius 6. "down/up" is *screen*-y, which is
inverted from axial `r`, so both moves are **inward**; the removed cells `(-7,0)`/`(7,0)`
have `|q|=7`, forcing `hexDist ≥ 7`, so they cannot fit inside r=6 — confirming inward.)

## Current State

- `terrain-generator.ts`:
  - `generateTerrain` assigns sequential IDs to **all** hex-circle cells (127 for r=6),
    then `buildTerrainTiles` places terrain at off-grid positions (throws on overlap).
  - River routes over the full circle set (`positions`), so its anchors assume every
    circle cell is a precinct.
- `tutorial-004`: 127 precincts + 18 off-grid terrain tiles — 8 mountains on the NW edge
  (`q+r = -7`) and 10 ocean tiles on the SE edge (`q+r = +7`). River `(-3,-3) → via (-2,2)
  → (0,6)`; both river endpoints currently sit on soon-to-be-terrain cells.
- **Blast radius: tutorial-004 is the only scenario that authors terrain tiles** (audited
  across all scenario/tutorial JSONs). Scenarios 002 / tutorial-003 / tutorial-005 have
  rivers but zero terrain tiles, so their land set stays the full circle → behavior
  unchanged.
- No load-time or cross-stage invariant assumes precincts tile a *complete* circle:
  `hexCircleSize` is used only inside the generator + its own self-consistency test, and
  loader `checkPrecinctCount` is `precincts.length ≥ 1`. A 111-cell irregular map loads
  fine.

## Goals / acceptance criteria

- [x] **Invariant flip:** generator rejects any terrain tile with `hexDist > radius`
      (error: terrain outside the r=n boundary). No terrain — precinct, mountain, lake, or
      ocean — is emitted outside the boundary.
- [x] **Terrain replaces precincts:** `precinctPositions = hexCircle(radius) − terrainPositions`;
      sequential IDs assigned to land cells only. The precinct under a terrain tile is gone.
- [x] **River over land:** river routes over the land-only position set and terminates
      validly against the new coast / mountains (no mid-land loose end).
- [x] **tutorial-004 re-authored:** mountains → 7 rim tiles `(-6,0)…(0,-6)`, ocean → 9 rim
      tiles `(6,0)…(-2,6)`, river re-anchored mountains → sea; 127 → 111 precincts; all
      terrain at `hexDist = 6`, none outside.
- [x] **Winnable:** a concrete balanced (±15% population) + contiguous 4-district partition
      exists over the 111-cell map (feasibility witness) and is asserted by the winnability
      e2e.
- [x] **Tests:** `terrain-generator_test.ts` — flip the old "overlap throws" test (overlap
      now removes the precinct) and add a new "terrain outside radius throws" test; existing
      river tests stay green.
- [x] **Visual:** terrain renders on the outer ring **inside** the circle (no precinct
      beneath), map-fit frames it, river runs mountains → sea (preview screenshot).
- [x] Full local `bazel test //game/...` green.

## Resolution

Resolved 2026-07-08. **Generator invariant flipped** (`terrain-generator.ts`): the full hex
circle becomes `allPositions`; terrain positions are subtracted to yield the land-only
`positions`; `buildTerrainTiles` now **rejects** any tile with `hexDist > radius` (the old
overlap-throws check is gone — overlap is the intended semantics: a terrain tile sits on a
removed-precinct cell). The river routes over the land-only set and terminates against the
carved rim — no river-module signature change was needed.

**tutorial-004 re-authored** to 111 precincts: 7 mountain tiles on the NW rim (`q+r = -6`),
9 sea tiles on the SE rim + south curl, river re-anchored `(-3,-2) → via (-2,2) → (0,5)`
(mountains → sea, over land). Terrain weights stay 1.0 (cosmetic). Preview confirms the terrain
on the outer ring *inside* the circle, map-fit framing it, river mountains → sea, no console errors.

**Owner decision — accepted the "layer win".** The rim-carve broke the four-cardinal-wedge
balance the capstone was built around (a natural quadrant carve now runs E/W ~+17%, S ~−23%,
over ±15% — partly the pointy-top hex geometry, partly the asymmetric carve). Rather than
re-tune the villages or reshape the frame, the owner accepted the map as-is: the capstone's win
is a complete legal map reached via the Map Validity panel, and the winnability e2e proves a
balanced + contiguous partition exists (four equal-population north–south layers). The "even out
four cardinal wedges" framing is retired; spec + plan wording updated to match.

**Tests.** `terrain-generator_test.ts` flipped (overlap-removes-precinct + outside-radius-throws).
The reshape surfaced two sibling fixtures that assumed the old off-grid model — `loader_integration_test`
(precinct count 127 → 111) and `population-stage_test` (a feature-anchor fixture placed terrain
off-grid at (3,-1)/(3,-2) → moved to in-boundary rim cells). e2e: new `tutorial-004-terrain.spec.ts`
(terrain smoke + layer winnability) + reconciled the three stale tutorial-004 tests in
`scenarios.spec.ts`. `bazel test //game/...` 47/47 green.

## References

- GAME-125 — terrain implementation (the feature this refines) [resolved]
- DESIGN-008 — terrain model
- `game/web/src/pipeline/terrain-generator.ts`, `river.ts`
- `game/scenarios/tutorial-004.spec.yaml`, `tutorial-004.json`
- Plan: `thoughts/shared/plans/2026-07-07-game-127-terrain-inside-boundary.md`
