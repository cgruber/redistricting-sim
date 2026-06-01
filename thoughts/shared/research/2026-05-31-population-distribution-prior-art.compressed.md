<!--COMPRESSED v1; source:2026-05-31-population-distribution-prior-art.md-->
§META
date:2026-05-31 researcher:claude(web-search-researcher) branch:main repo:cgruber/redistricting-sim
topic:population-distribution-prior-art
tags:map-generation population settlement procedural-generation terrain GAME-084 GAME-087
status:complete last_updated:2026-05-31 last_updated_by:claude

§SUMMARY
Research into population distribution for procedural hex-grid maps. Motivated by GAME-087
(terrain-aware population stage). Converges on two-layer approach: (1) per-cell terrain suitability
score; (2) optional settlement seed layer. Combine multiplicatively, not additively.

§ACADEMIC
AHP Weighted Overlay (standard GIS approach): weighted sum of terrain factors.
Pre-modern weights (inferred from Yangtze River Delta study PMC9859550):
  topographic_relief:0.35 water_proximity:0.35 vegetation:0.20 other:0.10
Gravity model: density ∝ inverse-distance² attractiveness of settlements; too expensive per-cell
  but insight transfers: distance-from-settlement matters for rural fill
Integro-differential emergence (PMC9065963): Gaussian mobility kernel β controls city spacing
  (~45–50 km UK data); tune β to desired hex separation

§GAME_ART
Azgaar Fantasy Map Generator (most inspectable OSS):
  suitability = elevation_penalty + harbor_bonus + river_flux_bonus + biome_habitability
  rural_pop = cell_area × biome_habitability_table[biome]
  burg_pop scaled from rank + regional rural pop
  source: modules/burgs-and-states.js → https://github.com/Azgaar/Fantasy-Map-Generator
Martin O'Leary / Uncharted Atlas:
  iterative placement: score all → place top → rescore (placed cities repel nearby) → repeat
  produces Zipf spacing automatically without explicit min-distance constraints
Civ VI/VII: rivers = primary attractor via Appeal+Housing bonuses; no pre-distributed density
Dwarf Fortress: biome_support tokens per civ; expansion simulation-driven

§SCORING_FORMULA
Jason Dookeran's BFS-based implementation (calibrated over 50+ generations):
  center_score = -dist_to_center × 0.5
  water_score  = 5.0 if dist_to_water≤1 else -dist × 0.3
  river_score  = -dist_to_river × 0.2
  biome_score  = {Grassland:10 TempForest:8 Beach:6 Highland:5 Wetlands:4 Desert:2 Mountain:0}
  total = sum above
Pre-compute BFS distance fields (water tiles, river tiles) for O(1) per-cell lookups
Cities vs towns: different parameter sets (cities weight coastal > interior; towns opposite)

§NOISE
fBm pipeline (Red Blob Games canonical):
  density(x,y) = Σ(amplitude_i × noise(freq_i × x, freq_i × y)) / Σ(amplitude_i)
  → multiply by suitability mask
  → pow(result, 2.0)  # KEY: pushes low-density→0, creates sharp city peaks
  → normalize to target total pop
For small hex grids (no noise): Gaussian bumps: peak × exp(-hex_dist² / 2σ²)

§ZIPF
Real cities: P_rank = P_max / rank^α, α≈1. Game generators use α in [0.7, 1.2].
Practical: score N hexes → place seeds → assign P_max explicitly → P_rank = P_max / rank^0.85

§RECOMMENDED_PIPELINE
Step 1 — terrain suitability (per precinct, automatic):
  suitability = f_river × f_lake × f_coast × f_mountain × 1.0(default)
  f_river     = exp(-k × bfs_dist_river), k: halves every 2–3 hexes
  f_lake      = exp(-k × bfs_dist_lake), slightly stronger than coast
  f_coast     = exp(-k × bfs_dist_coast), halves every 5–7 hexes
  f_mountain  = 0.05 for mountain-adjacent; 1.0 else
  quick biome multipliers: lakeside:1.4 riverside:1.3 coastal:0.9 mountain-adj:0.5 else:1.0

Step 2 — settlement seeds (optional spec, auto-placed otherwise):
  spec-driven: anchor→resolve to best-scoring precinct matching anchor type
  auto: top-N suitability hexes with BFS min-separation → Zipf pop assignment
  bump: pop_contribution = peak × exp(-hex_dist² / 2σ²), σ ≈ radius/2

Step 3 — rural fill + normalize:
  remaining = base × suitability × jitter; normalize to total target

§SIMPLIFICATION_FOR_OUR_CONTEXT
Maps small (~50–150 precincts); explicit terrain tile adjacency; no continuous elevation field.
  → no full noise map needed; BFS distance fields + adjacency context sufficient
  → no full Zipf emergence needed; 1–3 named settlement types covers most scenarios
  → step 1 alone (suitability × jitter) already produces usable output for spec-less scenarios

§REFS
Azgaar (live): https://azgaar.github.io/Fantasy-Map-Generator/
Azgaar blog (settlements): https://azgaar.wordpress.com/2017/11/21/settlements/
Azgaar GitHub: https://github.com/Azgaar/Fantasy-Map-Generator
Red Blob Games (terrain from noise): https://www.redblobgames.com/maps/terrain-from-noise/
Red Blob Games (mapgen2): https://github.com/redblobgames/mapgen2
tmwhere (city gen): https://www.tmwhere.com/city_generation.html
Dookeran (settlement gen): https://jdookeran.medium.com/day-11-settlement-generator-1dc29ea0be18
Urban emergence model: https://pmc.ncbi.nlm.nih.gov/articles/PMC9065963/
AHP suitability (Yangtze): https://pmc.ncbi.nlm.nih.gov/articles/PMC9859550/
Gravity model: https://www.sciencedirect.com/science/article/abs/pii/S0038012196000183
Civ VII map gen: https://civilization.2k.com/civ-vii/game-guide/gameplay/map-generation/
rlguy FantasyMapGenerator: https://github.com/rlguy/FantasyMapGenerator
Zipf cities (PNAS): https://www.pnas.org/doi/10.1073/pnas.1913014117
