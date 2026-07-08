# GAME-127 — Terrain confined to the r=n boundary + tutorial-004 rim re-author

## Metadata
- date: 2026-07-07
- author: claude + cgruber
- ticket: GAME-127
- status: complete (owner accepted the layer win; PR held for serve-local eyeball)

## Goal

Flip the terrain-generator invariant so cosmetic terrain (mountain / sea / lake) must
live **inside** the hex-circle boundary (`hexDist ≤ radius`) and **replaces** the precinct
on its cell — the opposite of today's rule (terrain must sit off-grid and may never overlap
a precinct). Then re-author tutorial-004 so its mountains + ocean occupy the **outer ring**
of the r=6 map, with the river flowing mountains → sea over land. tutorial-004 stays
winnable — though its four-wedge population-balance lesson did **not** survive the rim-carve;
by owner decision (2026-07-08) the capstone's win is a complete legal map via the Map Validity
panel, not a natural four-quadrant carve (see the Finding under Rebalance below).

## Context (current state + motivation)

- `terrain-generator.ts`: `generateTerrain` assigns sequential IDs to **all** hex-circle
  cells; `buildTerrainTiles` throws if a tile overlaps a precinct and *intentionally allows
  off-grid tiles*. The river routes over the full-circle position set.
- tutorial-004 shipped under **GAME-125** with 18 terrain tiles at `hexDist 7` — one ring
  **outside** the r=6 map. On the 2026-07-06 serve-local eyeball the owner said *"close, but
  no cigar"*: the mountains and ocean float outside the playable circle; they should **be**
  the map's outer ring.
- Owner's transform (his "y" is *screen*-y, inverted from axial `r`, so both moves are
  **inward**): every mountain `r+1` — drop `(-7,0)` (can't fit inside r=6, `|q|=7`); every
  ocean `r−1` — drop `(7,0)`. The precincts under the moved terrain are simply removed.
  General rule he stated: *the generator should never emit terrain outside the r=n boundary.*
- **Blast radius = one map.** tutorial-004 is the only scenario that authors terrain tiles
  (audited across every scenario/tutorial JSON). Rivers in scenario-002 / tutorial-003 /
  tutorial-005 have no terrain, so their land set stays the full circle → unchanged. No
  loader / pipeline invariant assumes a *complete* circle: `checkPrecinctCount` is
  `precincts.length ≥ 1`, and `hexCircleSize` is only used inside the generator and its own
  self-consistency test. A 111-cell irregular map loads fine.

## Approach (strategy + key decisions)

### A. Generator invariant flip (general — `terrain-generator.ts`)

- The full circle becomes `allPositions`. Terrain cells are collected into a set and
  **subtracted** to yield the land-only `positions`.
- New invariant in `buildTerrainTiles`: reject any tile with `hexDist > radius` (error names
  the boundary). The old overlap-throws check is **removed** — overlap is now the intended
  semantics (a terrain tile sits on a circle cell whose precinct has been removed).
- Sequential precinct IDs are assigned over the land-only `positions`. Every downstream
  consumer (`routeRiver`, `resolveRiverAnchor`, `validateRiverEdges`, `buildPosIndex` /
  `buildRiverEdges`) already keys off `positions` / `posToId`, so threading land-only through
  is almost mechanical — the river then routes over land and terminates against the carved rim.
- **Key insight (no river-module signature change):** feeding the land-only set to
  `routeRiver` makes coast/mountain-adjacent corners `count == 2` boundary corners, so a
  river that ends at the coast is a valid terminus rather than a mid-land loose end. Confirm
  `validateRiverEdges` accepts coast termination over the land set without the optional
  `tiles` argument; pass `tiles` only if it turns out to be required.

Pseudocode (shape only):

```
allPositions   = generateHexCircle(radius)          // full circle
terrainSpecs   = terrain?.tiles ?? []
terrainPosSet  = set of (q,r) from terrainSpecs
positions      = allPositions.filter(p => !terrainPosSet.has(p))   // land only
precincts      = positions.map(seqId)               // IDs over land only
terrainTiles   = buildTerrainTiles(terrainSpecs, radius)  // throws if hexDist > radius
river          = routeRiver(positions, …) | river_edges   // over land only
```

### B. tutorial-004 re-author (content — `tutorial-004.spec.yaml`)

- Mountains → **7** rim tiles: `(-6,0) (-5,-1) (-4,-2) (-3,-3) (-2,-4) (-1,-5) (0,-6)`
  (`r+1` on the old NW edge; `(-7,0)` dropped).
- Ocean → **9** rim tiles: `(6,0) (5,1) (4,2) (3,3) (2,4) (1,5) (0,6) (-1,6) (-2,6)`
  (`r−1` on the old SE edge; `(7,0)` dropped).
- River re-anchored `from (-3,-2)` (foot of the mountains) `via (-2,2)` `to (0,5)` (last land
  before the coast) — all three land, `hexDist ≤ 6`. Mountains → sea reads thematically and
  routes over land.
- Rewrite the now-wrong "one ring OUTSIDE / requires off-grid tiles" comments in the spec.
- 127 → 111 precincts. `terrain_weights` stay 1.0 (cosmetic — the lesson is four-wedge
  population balance, not terrain-driven suitability).

### Rebalance → Finding (2026-07-08)

Removal is asymmetric (7 NW mountains vs 9 SE/S ocean) **and** strips the N/W/E/S extreme
rim cells — exactly where the four "opposite-pair" villages anchor, the whole basis of the
four-wedge ±15% balance. **The four-wedge split did not survive.** A natural cardinal quadrant
carve runs E/W ~+17%, S ~−23% on the reshaped map — partly structural (on a pointy-top hex the
cardinal E/W angle-wedges are ~17% heavier than the N/S pointy wedges) and partly the asymmetric
rim-carve. The "even the wedges out" move no longer passes.

The map **is** still winnable, and the winnability e2e proves it — but via four **equal-population
north–south layers** (sort precincts by screen-y, cut into four equal-pop contiguous slabs). That
witness passes *by construction* on almost any convex-ish shape, so it **sidesteps** rather than
restores the wedge lesson.

**Decision (2026-07-08, owner): (a) — accept equal-population layers as the capstone win.** The
"even out four cardinal wedges" framing is retired; the taught skill is balance-via-panel and the
field stays comfortably balanceable. No map change — the terrain, populations, and e2e ship as-is;
the opposite-pair village design is kept (it still yields a symmetric, balanceable field), with its
wedge-centric spec wording softened. Alternatives not taken: (b) re-tune villages so a natural
four-quadrant split balances again, (c) reshape the terrain frame for symmetry.

### Key decision

New ticket, not a reopen of GAME-125. The invariant flip is general pipeline scope beyond
tutorial-004, and GAME-125's terrain already shipped; this mirrors the project's follow-up
pattern (GAME-122 → GAME-121).

## Steps (ordered)

1. **Generator:** rename `positions → allPositions`; build `terrainPosSet`; `positions` =
   land-only; `buildTerrainTiles(radius)` rejects `hexDist > radius`. Thread land-only through
   the river calls (already keyed off `positions`).
2. **Unit tests:** flip "overlap throws" → assert overlap **removes** the precinct (count
   drops, tile present); add "terrain outside radius throws"; keep the river round-trip tests
   green.
3. **Re-author** `tutorial-004.spec.yaml` (tiles + river anchor + comments).
4. **Regenerate** `tutorial-004.json` (`bazel run …:generate_scenario`, absolute paths).
   Verify: 111 precincts, 16 tiles all `hexDist ≤ 6`, zero off-grid, `river_edges` run NW → S.
5. **Feasibility witness:** balanced + contiguous 4-partition over the JSON; reposition
   villages if needed; update the tutorial-004 winnability e2e to assert that partition.
6. **Preview:** terrain on the outer ring *inside* the circle, map-fit frames it, river
   mountains → sea. Screenshot for the owner.
7. **Full** `bazel test //game/...` green; open focused PR (6 body sections,
   `--owner cgruber --repo redistricting-sim`); resolve GAME-127 in the same branch; hold for
   owner serve-local eyeball.

## Risks + mitigations

- **R1 — river snaps to the wrong rim corner.** `routeRiver` picks the nearest boundary corner
  and carving the rim adds new corners. → Verify emitted `river_edges` + preview; nudge
  `from`/`to` if the river lands off the mountain/sea edges.
- **R2 — four-wedge balance can't reach ±15% after asymmetric removal + anchor shift.** →
  Feasibility witness *before* claiming winnable; reposition villages; e2e asserts the witness.
- **R3 — a hidden completeness assumption trips at load.** → Cleared by audit
  (`checkPrecinctCount = ≥ 1`, no `=== 127`), with the full local suite as backstop.
- **R4 — `validateRiverEdges` rejects coast termination without `tiles`.** → If so, pass the
  optional `tiles` argument (already supported); confirmed in step 4.

## Done (acceptance criteria)

- Generator rejects terrain with `hexDist > radius`; no terrain emitted outside the boundary.
- Terrain replaces precincts: `precinctPositions = hexCircle − terrainPositions`; IDs over land only.
- River routes over land and terminates validly against the coast / mountains.
- tutorial-004: 7 mountain + 9 ocean rim tiles, 111 precincts, river re-anchored mountains → sea, all terrain `hexDist ≤ 6`.
- A balanced (±15%) + contiguous 4-partition exists (witness = equal-population north–south layers)
  and is asserted by e2e. **Decided (owner, 2026-07-08):** accept the layer win; the natural
  four-quadrant (wedge) split is retired.
- Unit tests: overlap-removes-precinct + outside-radius-throws; river tests green.
- Preview: terrain on the outer ring inside the circle; river mountains → sea.
- `bazel test //game/...` green.
