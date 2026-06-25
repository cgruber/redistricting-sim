---
id: GAME-100
title: Terrain feature generation — lay out rivers/coasts/mountains from intent, feed pop + demographics
area: game, tooling
status: open
created: 2026-06-25
---

## Summary

Make the pipeline's **terrain stage actually generate terrain features** — route rivers, place
coastlines/mountains/lakes from high-level intent — instead of only passing through exact
hand-authored coordinates. Generated terrain then feeds population suitability (already wired,
GAME-087) and optionally informs demographics/lean. This is the capability the owner assumed
existed; it does not.

## Current state (verified in code, 2026-06-25)

The GAME-084 pipeline is `terrain → population → demographics → counties → assembler`.
Everything **downstream of terrain is generated**: population has a coherent field
(gradient + noise + settlements + contrast, GAME-088), demographics has lean zones, counties
flood-fill the population field (GAME-089). But the **terrain stage is pure passthrough**:

- `terrain-generator.ts` generates the hex grid, then `buildTerrainTiles` / `buildRiverEdges`
  only **validate + convert** the exact `tiles` and `river_edges` the spec hand-authors
  (adjacency check, no-precinct-overlap check). There is **no routing, no placement, no
  generation** of any feature.
- Consequence: rivers must be authored as exact adjacent-precinct pairs whose **shared hex
  edges** chain vertex-to-vertex. This is error-prone — the tutorial-003/004 rivers were
  authored as vertically-adjacent pairs whose shared edges are disconnected horizontal stubs
  (the "broken river"). The generator's adjacency check passed them because each pair *is*
  adjacent; it has no notion of chain connectivity or valid endpoints.

GAME-084's terrain AC was written as coordinate-driven ("produces ... terrain tiles + river
edges" from the spec), so feature generation was never scoped — not abandoned, never built.

## Goals / Acceptance Criteria

### A. River-validity constraint (foundational guardrail — can land first) ✅ DONE

- [x] Validate river edges at generation time (`buildRiverEdges` or a `validateScenario` pass):
      a river is a set of shared-edge segments; reject any configuration where a river vertex
      is a **loose end** — i.e. a degree-1 river vertex that is **not** (a) on the map boundary
      (flows off-map), (b) adjacent to a water tile (sea/lake), or (c) shared with another river
      vertex (part of a connected chain). Teeny disconnected segments are per-se invalid.
      → `river.ts` `validateRiverEdges` (degree-1 corner ringed by ≥3 precincts ⇒ throw).
- [x] Clear error naming the offending vertex/edge so spec authoring fails fast.
      → error names the offending corner: "River has a loose end at corner <x,y>: …".
- [x] Unit tests: a connected rim-to-rim chain passes; a single stub fails; a chain ending in a
      lake passes; a chain with a mid-air loose end fails. → `river_test.ts` (6 tests) +
      `terrain-generator_test.ts` (routed-river passes; mid-land single edge throws /loose end/).

### B. Terrain feature generation

- [x] **River routing:** from high-level intent (e.g. `river: { from: <anchor/feature>, to:
      <sea|lake|off-map> }`), generate a **connected** river_edge chain that satisfies the
      validity constraint by construction (walks the hex-edge graph; starts at the source —
      which may be anywhere, incl. a mountain corner — and ends in water or off-map).
      → `river.ts` `routeRiver` (BFS over internal-edge graph, rim-to-rim) + `resolveRiverAnchor`
      (cardinal / "center" / {q,r}); wired into `terrain-generator.ts`; `TerrainSpec.river`.
- [ ] **Coastline:** from `coast: <side>` (or a sea region), place sea tiles along the chosen
      rim. Note sea tiles may sit on a **rim hex-edge** (shared edge of the circle), not only
      fully outside it (`buildTerrainTiles` already allows tiles outside the precinct set).
- [ ] **Mountains / lakes:** place from intent (a range on a side; a lake at/near an anchor),
      producing the foothill/lakeside fringes the renderer already supports.
- [x] Generated terrain feeds the population stage's suitability (riverside/coastal/lakeside/
      mountain-adjacent weights — already consumed) so settlements/density respond to it.
      → routed river edges flow into `population-stage.ts` riverside (1.3×) suitability; T3/T4
      regenerated with the river-fed field, both still balanced/winnable (e2e + arithmetic check).
- [ ] Optionally let terrain inform demographics (e.g. coastal vs inland lean) — spec-driven,
      off by default.
- [x] Hand-authored exact `tiles`/`river_edges` still supported (generation is opt-in via the
      higher-level intent fields). → `terrain.river` takes precedence; `river_edges` still honored
      (and now also validated for loose ends).

### Progress (2026-06-25)

River half landed: validity gate (A) + river routing (B) + tutorial-003/004 rivers fixed
(regenerated as routed rim-to-rim chains; the old broken stub rivers are gone). Coastline,
mountain/lake generation, and the optional terrain→demographics hook remain — ticket stays open
for those. Coastlines are still deferred to the visual pass in both tutorial specs.

## Design notes / principles (from owner)

- **Rivers must start or end in a body of water, or off-screen.** A river can *start* anywhere
  (including a mountain corner) but must *end* in a lake/sea or run off-map. (Not necessarily
  both ends — one valid terminus suffices; the other can be off-map.)
- Geography stays **cosmetic** (`project_geography_cosmetic`): generated features must not feed
  contiguity/scoring/criteria — only rendering + (suitability) population + optional demographics.
- Pipeline order matters: **terrain first**, so population + demographics can read it.
- Keep spec knobs plain-English (`[[feedback-plain-english-tooling-knobs]]`): `coast: south`,
  `river: { from: northwest-hills, to: sea }` — not raw coordinate lists.

## Sequencing

Owner's call (2026-06-25): do this **after** the tutorial-002/003 playtest fixes (done) and
**before** the tutorial-004 capstone revisit. The broken tutorial-003/004 rivers are fixed as a
by-product (regenerate with routed rivers) rather than hand-patched.

## References

- `game/web/src/pipeline/terrain-generator.ts` (passthrough today), `spec-types.ts` (`TerrainSpec`).
- `game/web/src/render/mapRenderer.ts` `renderRivers` / `buildRiverChains` (shared-edge segments,
  chained by shared vertex) — the geometry any generator/validator must match.
- `game/web/src/model/hex-geometry.ts` (flat-top; `HEX_DIRECTIONS`, `hexCorners`).
- GAME-084 (pipeline), GAME-087 (terrain→population suitability), GAME-088/089 (population +
  county generation). GAME-098/099 (the tutorials whose rivers this fixes).
