---
date: 2026-05-31
researcher: claude (web-search-researcher)
branch: main
repository: cgruber/redistricting-sim
topic: population-distribution-prior-art
tags: map-generation, population, settlement, procedural-generation, terrain, GAME-084, GAME-087
status: complete
last_updated: 2026-05-31
last_updated_by: claude
---

## Summary

Research into how population distribution is modeled in procedural map generation, strategy games,
and geographic simulations. Motivated by GAME-087 (terrain-aware population stage). The goal was
to find concrete prior art — formulas, weights, algorithms — rather than high-level descriptions.

The findings converge on a two-layer approach: (1) a per-cell terrain suitability score that
suppresses population in hostile terrain and boosts it near water; (2) an optional settlement seed
layer that places discrete population centers using a scored placement algorithm. Most implementations
combine these multiplicatively rather than additively.

---

## Academic / GIS Models

### AHP Weighted Overlay (most directly applicable)

Multi-Criteria suitability analysis using the Analytic Hierarchy Process is the standard GIS
approach. Each cell gets a weighted sum of terrain factors. Empirically-derived weights from a
2022 study of the Yangtze River Delta (PMC9859550):

| Factor | Weight |
|---|---|
| Topographic relief (slope/elevation) | 0.221 |
| Hydrological index (river/water proximity) | 0.206 |
| Night-light proxy (human activity) | 0.173 |
| Vegetation / NDVI | 0.130 |
| Traffic accessibility | 0.086 |
| Climate comfort | 0.013 |

**Takeaway for our use case:** Terrain relief and water proximity together account for ~43% of
suitability. For a non-modern scenario (no traffic/night-light data), scale these up proportionally.
Rough pre-modern weights: topographic 0.35, water proximity 0.35, vegetation/land-cover 0.20,
other 0.10.

### Gravity Model

Population density at a cell is proportional to the inverse-distance-squared attractiveness
of all other settlements — a potential field. Too expensive for a per-precinct pass on small maps,
but the insight transfers: **distance-from-settlement matters** for rural density filling.

### Integro-Differential Emergence Model (PMC9065963)

Urban emergence modeled via a population density PDE where attractiveness A(x) = services_nearby
× (1 − crowding). Uses a Gaussian mobility kernel of ~10 km scale. Produces emergent city
formation without hand-placing settlements. The Gaussian kernel's characteristic scale β controls
the resulting city spacing (~45–50 km in UK data). **For a game hex grid, tune β to desired
city separation in hex units.**

---

## Procedural Game Generation

### Azgaar's Fantasy Map Generator (most directly inspectable open-source prior art)

Settlement placement uses a per-cell suitability score:
- Elevation penalty: mountain cells receive fewer points
- Harbor bonus: coastal cells with exactly one ocean neighbor get a sheltered-haven bonus
- River bonus: proportional to **river flux** (flow accumulation value; confluence/estuary cells
  get extra bonus)
- Biome habitability table (0–100 per biome type) drives rural population: `rural_pop = area × habitability`
- After road generation: road-following / crossroads bonuses added
- Small jitter prevents monotonous clustering

Burg population scales from rank and the region's total rural population.

**Source:** `modules/burgs-and-states.js` in https://github.com/Azgaar/Fantasy-Map-Generator

### Martin O'Leary's "Uncharted Atlas" Generator

Cities placed iteratively: score all candidates, place highest scorer, **recalculate all scores**
accounting for the newly placed city (placed cities repel nearby placements). This produces
the Zipf-like spacing of settlements automatically without explicit minimum-distance constraints.

### Civilization VI/VII

Civ VII uses Voronoi diagrams → tectonic plate simulation → landmass growth, with rivers as the
primary settlement attractor. Rivers confer both Appeal and Housing bonuses. No pre-distributed
density field — expansion is simulation-driven via tile yields.

Civ VI: Appeal metric per tile + river Housing bonus drives city growth post-placement.

### Dwarf Fortress

Civilization placement is biome-driven: each civ has `BIOME_SUPPORT` tokens per biome type. Expansion
is simulation-driven (civs spread outward from preferred biomes, stopped by terrain and population caps).
No single density function; emergence is fully simulated.

---

## Settlement Placement: Scoring Formula (Game Dev Practice)

From Jason Dookeran's settlement generator (concrete BFS-based implementation):

```
center_score = -dist_to_center * 0.5
water_score  = 5.0 if water_dist <= 1 else -water_dist * 0.3
river_score  = -river_dist * 0.2
biome_score  = { Grassland: 10, Temperate Forest: 8, Beach: 6,
                  Highland: 5, Wetlands: 4, Desert: 2, Mountain: 0 }

total = center_score + water_score + river_score + biome_score
```

**Key implementation note:** Distance fields (BFS from water tiles, BFS from river tiles) are
pre-computed once, transforming O(n²) repeated lookups into O(1) per cell. Weights (0.5, 0.3, 0.2)
calibrated over 50+ test generations.

Cities and towns use different parameter sets: cities weight coastal/water more heavily; towns
weight interior agricultural land more.

---

## Noise-Based Population Clustering

From Amit Patel (Red Blob Games), the canonical fBm approach:

```
density(x, y) = (1.0 * noise(1*nx, 1*ny)
              +  0.5 * noise(2*nx, 2*ny)
              + 0.25 * noise(4*nx, 4*ny))
              / 1.75   # normalize
```

Then the standard pipeline:

1. Generate fBm noise map (2–4 octaves), normalized 0–1
2. Compute per-cell suitability from elevation/terrain/water proximity
3. **Multiply**: `raw_pop(x,y) = noise(x,y) × suitability(x,y)`
4. Apply nonlinear reshape: `pow(raw_pop, 2.0)` — pushes low-density areas toward zero, creates
   pronounced urban peaks against sparse rural background
5. Normalize to target total population

**The pow(x, 2) reshape is the key insight** for getting Zipf-like city-to-rural contrast.

For hex grids without noise: Gaussian bumps around settlement seeds achieve the same effect. A
settlement at distance d hexes contributes `peak × exp(-d² / (2σ²))` population.

---

## Zipf's Law for City Sizes

Real city populations follow a power law: `P_rank = P_max / rank^α`, with α ≈ 1 (Zipf's law).
In practice, game generators use α in the 0.7–1.2 range.

**Practical approach:** Score N hexes by suitability, place settlement seeds, assign largest city
population P_max directly from spec, compute remaining populations as `P_max / rank^0.85`.

---

## Recommended Pipeline for Our Hex Grid

Synthesizing from all sources:

### Step 1 — Terrain Suitability Map (per precinct, automatic)

Multiplicative combination (so impassable terrain → zero regardless of other factors):

```
suitability = f_elevation × f_river_proximity × f_coast_proximity × biome_weight
```

Sensible functions:
- `f_river_proximity` = exp(-k × bfs_dist_to_river), k so that suitability halves every 2–3 hexes
- `f_coast_proximity` = exp(-k × bfs_dist_to_coast), softer — halves every 5–7 hexes
- `f_lake_proximity` = similar to coast but stronger (freshwater > saltwater historically)
- `f_elevation` (mountains): 0.05 for mountain-adjacent precincts; else 1.0 (our grid has no continuous elevation)
- `biome_weight`: use precinct terrain context — lakeside 1.4, riverside 1.3, coastal 0.9, mountain-adj 0.5, else 1.0

### Step 2 — Settlement Seeds (optional in spec, auto-placed otherwise)

If spec provides settlements: resolve each anchor to a specific precinct (snapping to the
best-scoring lakeside/riverside/etc. precinct near the specified anchor). Add a Gaussian
population bump: `peak × exp(-hex_dist² / (2σ²))`, σ ≈ radius/2.

If no settlements specified: find the top-N suitability-scored precincts as implicit city seeds
with a minimum BFS separation constraint (Poisson disc equivalent). Assign populations by Zipf.

### Step 3 — Rural Fill + Normalization

Remaining precincts: `base × suitability_score × jitter`. Normalize so total population
hits the spec target.

---

## Key Simplification for Our Context

Unlike Azgaar or Martin O'Leary (which generate entire worlds), our maps are small (~50–150
precincts), have explicit terrain tile adjacency, and need to produce redistricting-playable
populations (variation across precincts, but not wildly unrealistic). This means:

- No full noise map needed: BFS distance fields + per-precinct terrain context are sufficient
- No full Zipf emergence needed: 1–3 named settlement types covers most scenarios
- The suitability × jitter approach (step 1 alone) already produces usable output for scenarios
  that don't call for explicit cities

---

## References

- [Azgaar's Fantasy Map Generator (live)](https://azgaar.github.io/Fantasy-Map-Generator/)
- [Azgaar developer blog — Settlements](https://azgaar.wordpress.com/2017/11/21/settlements/)
- [Azgaar GitHub source](https://github.com/Azgaar/Fantasy-Map-Generator)
- [Red Blob Games: terrain from noise](https://www.redblobgames.com/maps/terrain-from-noise/)
- [Red Blob Games: mapgen2](https://github.com/redblobgames/mapgen2)
- [tmwhere: procedural city generation](https://www.tmwhere.com/city_generation.html)
- [Jason Dookeran: settlement generator](https://jdookeran.medium.com/day-11-settlement-generator-1dc29ea0be18)
- [Urban emergence integro-differential model (PMC9065963)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9065963/)
- [Human settlement suitability, Yangtze River Delta (PMC9859550)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9859550/)
- [Gravity model — urban density simulation (ScienceDirect)](https://www.sciencedirect.com/science/article/abs/pii/S0038012196000183)
- [Civilization VII: Map Generation](https://civilization.2k.com/civ-vii/game-guide/gameplay/map-generation/)
- [rlguy FantasyMapGenerator (C++)](https://github.com/rlguy/FantasyMapGenerator)
- [Zipf / power-law city sizes (PNAS)](https://www.pnas.org/doi/10.1073/pnas.1913014117)
