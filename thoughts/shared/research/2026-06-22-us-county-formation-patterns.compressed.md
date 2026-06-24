<!--COMPRESSED v1; source:2026-06-22-us-county-formation-patterns.md-->
§META
date:2026-06-22 researcher:claude(general-purpose subagent) git_commit:30662afea546 branch:main repo:cgruber/redistricting-sim
topic:us-county-formation-patterns
tags:counties map-generation procedural-generation heuristic GAME-084
status:complete last_updated:2026-06-22 last_updated_by:claude

§ABBREV
$cty=county $ctr=settlement center $seat=county seat $catch=catchment(precincts within radius r of a center)
$ff=priority-queue flood-fill $Ptot=total regional population $r=catchment radius(hexes)
$cosmetic=dashed-border overlay, no gameplay effect

§SUMMARY
Heuristic for procedurally generating $cosmetic $cty boundaries on small hex grids. $cty purely
visual; must only LOOK plausible. Core findings: (1) rural $cty size is AREA-driven via day's-ride-
to-$seat rule (fixed geographic size → east/south small, west large). (2) a dominant $ctr OVERRIDES
area logic & gets its own $cty (independent cities, consolidated city-counties: SF/Denver/NYC
boroughs). (3) $cty = compact blobs radiating from $seat, borders snap to pop troughs + rivers/
ridgelines. Recommendation: ONE region-grow ($ff) algo + a named `model` preset (seat_and_hinterland
/city_county/split_metro) expresses the real city↔cty patterns. Calibrate to OUR map sizes (~4-7 cty
@ 91hex, ~2-3 @ tutorial) via day's-ride→r≈2 hexes.

§RQ1_SIZE (what sets count & size)
Day's-ride rule = dominant driver of RURAL size: $cty sized so farmer rides to courthouse & back in
1 day → roughly FIXED geographic radius, not fixed pop. Texas 254 cty b/c explicit "no one >1 day
from courthouse." East/west gradient explained by: founding-era density (dense+slow=small;
sparse+rail=large; N.Calif small cty predate railroads/Gold Rush) + area data (median 622 sqmi;
west avg ~2427, Georgia ~343; range 12→145505 sqmi). Count: ~3143 cty+equiv, avg 62/state, Delaware
3→Texas 254; South/Midwest more cty than West/NE.
→TAKEAWAY: default size = AREA catchment, not pop quota; day's-ride = the size knob.

§RQ2_CENTERS (cty vs pop center) — 3 regimes by city dominance
1. DEFAULT(~most cty): dominant town = $seat + rural hinterland. single admin center, courthouse,
   rest is rural surround. ← reproduce this most often.
2. CONSOLIDATED city-cty (~40 natl): city dominates → city+cty govt merge, cty coterminous w/ city
   (SF Denver Philly, 5 NYC boroughs=5 cty).
3. INDEPENDENT city (41 natl, 38 in Virginia): city belongs to NO cty; primary admin division.
Common thread: bigger $ctr rel. to surroundings → stops being INSIDE a rural cty, becomes own dense
blob. = real-world basis for "urban core + rural ring": core=consolidated/independent-city case.

§RQ3_RATIOS (atmosphere, not direct params)
Avg cty pop(2019) 104435; median 25965 → mean≫median, pop heavily concentrated. >half US pop in 143
cty(4.6%); 137 cty>500k; 709<10k; 35<1k. No clean national "center >X% → own cty" stat exists →
that threshold is OUR extrapolation. County COUNT anchor must be geographic (area÷catchment), NOT
national per-state avg (wrong scale). → most generated maps: 1 dominant + few secondary centers.

§RQ4_SHAPE (what looks right)
- compact blobs (≈equidimensional, not slivers) → $ff/Voronoi from $seat gives this free.
- borders SNAP to natural features: rivers + ridgelines/watershed divides "often a basis for cty &
  state boundaries" (Virginia: Blue Ridge, Rappahannock/Rapidan whole-length cty borders).
- radiate from $seat (= seat + everything within a day's ride).
- west/flat = arbitrary straight survey lines (minor concern for small hex grid).
PROJECT TIE-IN(important): memory note project_geography_cosmetic says rivers ASSOCIATE w/ district
borders b/c higher-order political features (state/CTY lines, municipal limits) follow them — no
physical "can't cross river" rule. This research CONFIRMS mechanism: cty lines really follow rivers/
divides. → biasing $cosmetic cty borders toward rivers/troughs is doubly justified, BUT must stay a
SOFT visual bias, never a hard barrier. Cty overlay = the right place to SHOW river↔boundary
association w/o baking a false rule into gameplay.

§RQ5_PRIORART
Azgaar Fantasy Map Generator = most transferable. States & Provinces via $ff over cell graph from
seed burgs; cost favors cultural align, route access, land>ocean, unclaimed>contested; mountains/
rivers RAISE cross-cost (=border-snapping). States: 1 seed per capital burg, flood out. Provinces:
SUBDIVIDE a state — seeds at significant non-capital burgs above pop threshold, flood constrained to
parent cells. KEY MAP: cty=states(1 region/seed, flood-grown); urban-core-vs-ring=province
subdivision (dominant ctr subdivides own region). ONE algo, two behaviors via flag. (Reuses same
$ff/scoring machinery as sibling 2026-05-31 population doc.) Lower-priority: O'Leary/Uncharted Atlas
score-place-rescore (which ctrs anchor); Civ (rivers as attractors, no admin regions).
refs: deepwiki.com/Azgaar/Fantasy-Map-Generator/3.3-states-and-provinces ;
azgaar.wordpress.com/2017/11/21/settlements/

§RECOMMENDED_HEURISTIC
Inputs: per-precinct total_population field + list of settlement centers(local maxima) + map size.
Output: cty id per precinct. ONE algo = seeded $ff, parametrized by `model` flag. Hex dist=grid-graph.

STEP0 — target cty count from map size (day's-ride knob):
  catchment radius r=2 hexes (r2 disc=19 cells; w/ competition real catch lands ~10-15 cells).
  expected cty count ≈ total_precincts / ~14. → 91hex→~6 (band 4-7); 30hex→~2 (band 2-3).
  r = sole size knob: smaller r→more/smaller cty(east feel); larger→fewer/bigger(west feel).
  [EXTRAP: cell math sound, "~14 claimed" estimated. tune on output.]

STEP1 — classify centers (which anchor own cty): Ptot=Σpop. per ctr catch pop=Σpop of precincts
  within r (nearest-ctr wins ties).
  DOMINANT: catch ≥40% Ptot → guaranteed anchor + eligible for core/ring subdivision.
  ANCHOR:   catch ≥15-20% Ptot → own cty (town big enough to be a seat).
  MINOR:    <~15% → no own seed; absorbed into nearest anchor (= small towns share a rural cty).
  always keep ≥1 anchor (largest ctr). cap anchors to Step0 band: keep top-k by catch pop, k=target.
  [EXTRAP: 15%/40% cuts chosen to read right on 1- vs 3-ctr fields; not sourced. defaults to tune.]

STEP2 — grow cty ($ff; gives compactness+contiguity free): seed 1 cty per anchor's peak precinct.
  priority-queue $ff: pop lowest-cost frontier precinct, assign, push unclaimed neighbors.
  cost = 1 + w_trough*(1 - normalized_pop_neighbor) + w_feature*crosses_feature
  suggested w_trough≈0.5, w_feature≈1.0. fill until ALL precincts claimed (NO area cap during fill;
  r only set seed expectations; field troughs do real partition). → compact blobs radiating from
  seats, breaking at troughs/rivers.
  CONTIGUITY/ORPHANS: $ff contiguous by construction. post-fill sweep any unreachable straggler
  (coastal/feature island) → assign to nearest seat by hex dist.

STEP3 — apply NAMED `model` preset (real city↔cty patterns; share Steps0-2; differ only in #seeds
  in dense area + whether dense core carved). names=intuit-on-sight (owner reasons in city examples
  not raw knobs; see PLAIN_ENGLISH map + feedback-plain-english-tooling-knobs):
  model="seat_and_hinterland" (DEFAULT, Pattern B): each anchor region=final cty=town/seat+rural
    surround. minors absorbed Step1 → ONE cty can hold SEVERAL towns (Clark County WA=Vancouver+
    Camas+Battle Ground+unincorporated). most common real pattern.
  model="city_county" (Pattern A, =SF/Denver): for each DOMINANT ctr(≥40%) carve dense core own cty:
    URBAN CORE=contiguous precincts around peak w/ pop ≥ core_density*peak_pop (default 0.5)="out to
      certain density" cutoff; flood from peak (compact). raise core_density=tighter city; lower=eats
      more suburb.
    RING COUNTIES=remainder split into ring_counties cty (default auto from secondary towns/sectors;
      scenario-002 wants 2=west+east). = consolidated/independent-city (dense core own unit) wrapped
      by separate suburban/rural cty; mirrors Azgaar province subdiv. no dominant→degrade to seat_and_hinterland.
  model="split_metro" (Pattern C, =Portland across Multnomah/Washington/Clackamas): split_dense_center=
    true → place MULTIPLE seeds INSIDE one large ctr so cty lines cut THROUGH urban mass. use when 1
    city outgrew 1 cty.
  SATELLITE towns NOT a separate model: Vancouver-WA-like town (same state/region)=just another ctr,
    gets own cty via Step1 like Gresham/Beaverton. cross-state metros (Portland↔Vancouver WA) NEVER
    co-occur: map=single region, never crosses state line, no cross-border districting.

PLAIN_ENGLISH→preset (breadcrumb; owner won't recall raw knobs):
  "small town+rural around"→seat_and_hinterland | "cty w/ several towns(Vancouver/Camas/Battle
  Ground)"→seat_and_hinterland(absorption) | "city IS its own cty, SF/Denver"→city_county(raise
  core_density to tighten) | "city across several cty, Portland"→split_metro | "satellite town like
  Vancouver WA(same state) gets own cty"→add a settlement(no model change).

PRINCIPLES (don't violate when tuning):
  - cty UNEQUAL by design: no equal pop/area/shape. target count=#seeds ONLY, never balances. sanity
    is LOCAL("does cty wrap its seat?") never GLOBAL("are cty balanced across region?").
  - REGION CLIPS cty: precincts exist only inside map; edge cty truncated by boundary, conceptually
    continues off-map. few truncated edge cty=expected+fine, deliberate game simplification not a bug.
  - ONE cty can hold SEVERAL towns (Clark County): not every settlement=seat; sub-anchors absorbed.

STEP4 — cosmetic finish(optional,rec): dashed borders only, no gameplay. borders already prefer
  troughs+feature hexes(Step2)→ visually align w/ rivers/ridgelines = "looks right" & SAFE way to
  show river↔boundary assoc w/o making geography a rule (per project_geography_cosmetic). optionally
  name cty after seat.

DEFAULTS(all tunable): model=seat_and_hinterland(B; or city_county=A SF/Denver | split_metro=C
  Portland) | r=2(day's-ride size knob) | target=precincts/14(4-7@r5,2-3@tut) | anchor=15-20% Ptot |
  dominant=40% Ptot | core_density=0.5*peak | ring_counties=auto | split_dense_center=false |
  w_trough=0.5 | w_feature=1.0.
GROUNDED vs EXTRAP: STRUCTURE (area-catchment default, pop-override for dominant ctr, $ff from
  seats, borders snap to troughs/features, one algo+named preset) directly grounded RQ1-5 + Azgaar.
  NUMBERS (r=2, 15/40%, core_density, weights) = defensible extrapolations for small maps, NOT from a
  source; tune by eyeballing 1/2/3-center generated fields.

§REFS
Texas cty/day's-ride: https://www.texastribune.org/2018/07/03/beto-orourke-visited-all-254-counties-texas-why-are-there-so-many/
East/west size(Quora): https://www.quora.com/Why-are-counties-in-the-east-of-the-US-so-much-smaller-than-counties-in-the-west
Size/Gold-Rush era: https://letsgola.wordpress.com/2015/12/23/county-size/
Wikipedia County(US): https://en.wikipedia.org/wiki/County_(United_States)
Wikipedia County statistics: https://en.wikipedia.org/wiki/County_statistics_of_the_United_States
Census big/small counties: https://www.census.gov/library/stories/2017/10/big-and-small-counties.html
Wikipedia consolidated city-county: https://en.wikipedia.org/wiki/Consolidated_city-county
Wikipedia independent city(US): https://en.wikipedia.org/wiki/Independent_city_(United_States)
NLC consolidations: https://www.nlc.org/resource/cities-101-consolidations/
VirginiaPlaces watersheds/political: http://www.virginiaplaces.org/watersheds/3political.html
Azgaar DeepWiki states/provinces: https://deepwiki.com/Azgaar/Fantasy-Map-Generator/3.3-states-and-provinces
Azgaar settlements/regions: https://azgaar.wordpress.com/2017/11/21/settlements/
Sibling prior-art(reused $ff machinery): thoughts/shared/research/2026-05-31-population-distribution-prior-art.md
