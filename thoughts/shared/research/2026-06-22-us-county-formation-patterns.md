---
date: 2026-06-22
researcher: claude (general-purpose subagent)
git_commit: 30662afea546
branch: main
repository: cgruber/redistricting-sim
topic: us-county-formation-patterns
tags: [counties, map-generation, procedural-generation, heuristic, GAME-084]
status: complete
last_updated: 2026-06-22
last_updated_by: claude
---

## Summary

Research into how US counties actually got their count, size, and shape, distilled into a
heuristic for procedurally generating **cosmetic** county boundaries (a dashed-border overlay)
on small hex-grid maps in the redistricting game. Counties do not affect gameplay; they only
need to *feel* plausible to a player who knows roughly what US county maps look like.

The headline findings:

1. **Rural county size is area-driven, set by the "day's ride to the county seat" rule** — a
   county was historically sized so a farmer could ride to the courthouse and back in one day.
   This makes rural counties roughly *fixed geographic size*, which is why eastern/southern
   counties are small (dense, early-founded) and western counties are huge (sparse, late-founded).

2. **A dominant population center overrides area logic.** The common pattern is "one dominant town
   = county seat + rural hinterland." But when a city is big enough it gets *its own* county
   (independent cities, consolidated city-counties like SF/Denver/NYC boroughs). So county size is
   **area-driven by default, population-driven where a center dominates.**

3. **Counties are compact blobs whose borders snap to population troughs and natural features**
   (rivers, ridgelines/watershed divides). This dovetails with the project's existing
   "geography is cosmetic" note: rivers *align* with real county/state lines because higher-order
   political boundaries follow them — which is exactly why biasing cosmetic county borders toward
   rivers/troughs reads as correct.

The recommended heuristic (full spec in §RECOMMENDED_HEURISTIC) is **a single region-grow
(priority-queue flood-fill) algorithm with a named `model` preset**, not separate algorithms. The
real city↔county patterns fall out of one parameter: `seat_and_hinterland` (town + rural surround,
the default), `city_county` (dense core is its own county — *San Francisco, Denver*), and
`split_metro` (one city across several counties — *Portland*). Sizing is calibrated to *our* map
sizes (≈4–7 counties on a radius-5 / 91-hex map, ≈2–3 on a 30-hex tutorial) by mapping "day's ride"
to a catchment radius of ~2 hexes.

---

## RQ1 — What determines US county count and size?

**The day's-ride rule is the dominant historical driver of rural county size.** Counties needed
to be small enough that a resident could travel to the courthouse, conduct business, and return in
a single day on horseback — because most farmers could not afford more than one day away. Texas
followed an explicit guideline that no one should be more than a day's travel from their
courthouse, which is a major reason it has 254 counties.
([Texas Tribune](https://www.texastribune.org/2018/07/03/beto-orourke-visited-all-254-counties-texas-why-are-there-so-many/),
[Quora: east vs west counties](https://www.quora.com/Why-are-counties-in-the-east-of-the-US-so-much-smaller-than-counties-in-the-west))

This makes **rural county size roughly a fixed geographic radius** (a day's ride), not a fixed
population. Two corollaries explain the famous east/west size gradient:

- **Founding-era settlement density.** Counties drawn when an area was dense and travel was slow
  (colonial/antebellum East and South) are small; counties drawn when an area was sparse and
  railroads existed (the West, the Gold Rush) are large. Many of Northern California's small
  counties date to the Gold Rush, *before* railroads.
  ([Let's Go LA: County Size](https://letsgola.wordpress.com/2015/12/23/county-size/))
- **Area numbers bear this out.** Median county land area is ~622 sq mi (2000 census). Western
  counties average ~2,427 sq mi; Georgia's average ~343 sq mi. Range spans Kalawao County, HI
  (12 sq mi) to Yukon-Koyukuk, AK (145,505 sq mi).
  ([Wikipedia: County (United States)](https://en.wikipedia.org/wiki/County_(United_States)))

**Count.** ~3,143 counties + equivalents across 50 states + DC; average 62 per state; range from
Delaware (3) to Texas (254). Southern and Midwestern states tend to have *more* counties than
Western or Northeastern states.
([Wikipedia: County (United States)](https://en.wikipedia.org/wiki/County_(United_States)))

**Takeaway for us:** default county size is an *area catchment*, not a population quota. The
day's-ride rule is the knob: we map it to a small hex catchment radius (see §RECOMMENDED_HEURISTIC).

---

## RQ2 — How do counties relate to population centers?

Three regimes, ordered by how dominant the city is:

1. **Dominant town = county seat + rural surround (the default, ~most counties).** Each county has
   a single administrative center, the *county seat*, usually the largest town, with the courthouse.
   The rest of the county is its rural hinterland. This is the canonical "one center, one county"
   shape and the one we should reproduce most often.
   ([Wikipedia: County (United States)](https://en.wikipedia.org/wiki/County_(United_States)))

2. **City gets its own county — consolidated city-county (~40 nationally).** When a city's
   population dominates its surroundings, city and county governments merge: San Francisco, Denver,
   Philadelphia, the five NYC boroughs (each a county). The county still nominally exists but is
   coterminous with the city.
   ([Wikipedia: Consolidated city-county](https://en.wikipedia.org/wiki/Consolidated_city-county),
   [NLC: Consolidations](https://www.nlc.org/resource/cities-101-consolidations/))

3. **Independent city — city carved out of any county (41 nationally, 38 in Virginia).** A primary
   administrative division belonging to no county at all. Virginia's are a constitutional quirk
   originally meant to centralize trade and legal matters.
   ([Wikipedia: Independent city (US)](https://en.wikipedia.org/wiki/Independent_city_(United_States)))

**The common thread:** the bigger a center relative to its surroundings, the more it stops being
*inside* a rural county and becomes its *own* unit (and visually, a small dense blob). This is the
real-world justification for the user's "urban core + rural ring" model: the urban core is the
consolidated-city-county / independent-city case, and the ring is the rural hinterland the city
would otherwise have been the seat of.

---

## RQ3 — Typical ratios and thresholds

National statistics (atmosphere, not directly our parameters — we calibrate to map size in RQ-synthesis):

- **Average county population (2019): 104,435; median: 25,965** (Nicholas County, WV). Mean ≫
  median → a few huge counties pull the average up; most counties are small.
- **Extreme concentration:** more than half the US population lives in just 143 counties (4.6% of
  all counties). 137 counties exceed 500,000; 709 counties are under 10,000; 35 under 1,000.
  ([Census: Big and Small Counties](https://www.census.gov/library/stories/2017/10/big-and-small-counties.html),
  [Wikipedia: County statistics](https://en.wikipedia.org/wiki/County_statistics_of_the_United_States))

**What transfers to a threshold:** the distribution says population is *heavily* concentrated — a
small number of centers hold most people, the rest is thin rural fill. That maps to: most generated
maps should have **one clearly dominant center** plus a couple of secondary centers, and the
dominant one is a strong candidate for its own (or subdivided) county. There is no clean national
"a center with >X% warrants its own county" statistic in the literature — that threshold is an
extrapolation we make (see §RECOMMENDED_HEURISTIC) tuned to look right on 1-center vs 3-center
generated fields, not a number lifted from a source.

**County count vs region size:** the only defensible count anchor is geographic — region area ÷
catchment area. For our maps that yields ~4–7 counties at radius-5 and ~2–3 at tutorial size
(derivation in §RECOMMENDED_HEURISTIC). National per-state counts (avg 62) are at the wrong scale
to use directly.

---

## RQ4 — Shape patterns: what makes a county map "look right"?

- **Compact blobs.** Counties are roughly equidimensional regions around a seat, not long slivers.
  A flood-fill / Voronoi-style growth from the seat produces this naturally.
- **Borders snap to natural features — rivers and ridgelines/watershed divides.** Prominent
  ridgelines break land into watersheds, and these were "often a basis for county and state
  boundaries." Virginia's boundaries are a mix of natural features (rivers, divides) and straight
  survey lines; e.g. the Blue Ridge and the Rappahannock/Rapidan form county boundaries along their
  whole length.
  ([VirginiaPlaces: Watersheds & political boundaries](http://www.virginiaplaces.org/watersheds/3political.html))
- **Radiate from the seat.** Because size was set by travel time to the courthouse, a county tends
  to be "the seat plus everything within a day's ride," i.e. a catchment centered on the seat.
- **Straight survey lines in the flat/sparse West.** Out West where there were no settlements or
  rivers to anchor on, boundaries are often arbitrary straight lines. For a small hex grid this is
  a minor concern; compact blobs with feature-snapping read as correct.

**Project tie-in (important).** The repo memory note "Geography is cosmetic by default"
(`project_geography_cosmetic.md`) already states that rivers *associate* with district boundaries
because higher-order political features (state lines, **county lines**, historic municipal limits)
align with them — there is no physical rule that a district can't cross a river. This research
*confirms the mechanism*: county lines really do follow rivers/divides. So biasing cosmetic county
borders toward rivers and population troughs is doubly justified — but, per that note, it must stay
a *soft visual bias*, never a hard barrier. The county overlay is in fact the perfect place to
*show* the river/boundary association without baking a false rule into gameplay.

---

## RQ5 — Procedural-generation prior art

**Azgaar's Fantasy Map Generator** is the most directly transferable. It generates *States* and
*Provinces* with a **priority-queue flood-fill** over the cell graph, expanding outward from seed
burgs. Cost function favors: cultural alignment, route accessibility, land over ocean, and
unclaimed over contested cells; mountains/rivers raise cell-to-cell travel cost (which is exactly
the "borders snap to features" behavior we want).
- **States** seed one per capital burg, then flood-fill outward.
- **Provinces** subdivide a state's territory: seeds placed at significant (non-capital) burgs
  above a population threshold, then a flood-fill constrained to the parent's cells.
([DeepWiki: States and Provinces](https://deepwiki.com/Azgaar/Fantasy-Map-Generator/3.3-states-and-provinces),
[Azgaar: Settlements/Regions](https://azgaar.wordpress.com/2017/11/21/settlements/))

This is the key structural insight, and it maps cleanly onto counties:
**counties = states (one region per seed center, flood-grown), and the urban-core-vs-rural-ring
split = the province subdivision step (a dominant center subdivides its own region).** One
algorithm, two behaviors via a flag. (Our earlier `2026-05-31-population-distribution-prior-art`
doc already adopted Azgaar's flood-fill/scoring patterns for population — we reuse the same machinery.)

Other prior art (lower priority): Martin O'Leary / Uncharted Atlas uses iterative
score-place-rescore for city spacing (relevant to *which* centers anchor counties, not to growing
the regions); Civ-style generators treat rivers as attractors but don't draw admin regions.

---

## RECOMMENDED_HEURISTIC

A single, implementable decision procedure. Inputs: the per-precinct `total_population` field, the
list of settlement centers (local maxima from the population stage), and map size. Output: a county
id per precinct. One algorithm — **seeded priority-queue flood-fill** — parametrized by a named
`model` preset (`seat_and_hinterland` / `city_county` / `split_metro`; see Step 3) to express the
real city↔county patterns. Hex distances are grid-graph distances.

### Step 0 — Derive target county count from map size (the "day's ride" knob)

Map the day's-ride rule to a **catchment radius `r`**. A radius-2 hex disc is 19 cells; with
competition between centers, real claimed catchments land around 10–15 cells. So:

- Default catchment radius `r = 2` hexes (the "day's ride").
- Expected county count ≈ `total_precincts / ~14`.
  - Radius-5 / 91 hex → ~6 counties (target band **4–7**).
  - 30-hex tutorial → ~2 counties (target band **2–3**).

`r` is the single size knob: smaller `r` → more, smaller counties (eastern/southern feel); larger
`r` → fewer, bigger counties (western feel). *(Extrapolation: the cell-count math is sound but the
"~14 claimed cells" figure is estimated, not sourced. Tune against generated output.)*

### Step 1 — Classify centers (which centers anchor their own county)

Let `P_total` = sum of `total_population`. For each settlement center, compute its **catchment
population** = sum of population of precincts within `r` hexes (nearest-center wins on ties).

- **Dominant center:** catchment population ≥ **40%** of `P_total` → guaranteed anchor; eligible
  for core/ring subdivision.
- **Anchor center:** catchment population ≥ **15–20%** of `P_total` → anchors its own county
  (the "this town is big enough to be a seat" case).
- **Minor center:** below ~15% → does **not** get its own seed; it will be absorbed into the
  nearest anchor's county (this reproduces "several small towns share one rural county").

Always keep at least one anchor (the single largest center) even if no center clears 15%.
Cap anchors so the count stays in the Step-0 band: if too many centers qualify, keep the top-k by
catchment population where k = target county count. *(Extrapolation: the 15% / 40% cut points are
chosen to read right on 1-center vs 3-center fields, not lifted from a source — see RQ3. Treat as
defaults to tune.)*

### Step 2 — Grow counties (region-grow flood-fill; gives compactness + contiguity for free)

Seed one county at each anchor center's peak precinct. Run a **priority-queue flood-fill** (Azgaar
pattern): repeatedly pop the lowest-cost frontier precinct and assign it to that county, pushing its
unclaimed neighbors. Cost to claim a neighbor:

```
cost = base_step
     + slope_penalty   (steeper population drop between cells = cheaper to STOP here,
                         i.e. higher cost to cross → borders settle in population troughs)
     + feature_bias     (crossing a river or ridgeline hex adds cost → borders snap to features)
```

Concretely: `cost = 1 + w_trough * (1 - normalized_pop_of_neighbor) + w_feature * crosses_feature`.
Suggested weights `w_trough ≈ 0.5`, `w_feature ≈ 1.0`. Flood-fill continues until **all** precincts
are claimed (no area cap during fill — `r` only set seed expectations; the field's troughs do the
real partitioning). This yields compact blobs that radiate from seats and break at troughs/rivers.

**Contiguity & orphans:** flood-fill is contiguous by construction. After the fill, sweep for any
unreachable straggler precinct (shouldn't happen on a connected grid, but coastal/feature islands
could) and assign it to the nearest seat by hex distance.

### Step 3 — Apply the named `model` preset

This is where the real city↔county patterns diverge — they all share Steps 0–2 and differ only in
(i) how many seeds land in the dense area and (ii) whether the dense core is carved out. The `model`
field is a **named archetype** chosen to be intuited on sight; the raw knobs below sit underneath as
optional overrides. (Naming rationale: the owner reasons in real-city examples, not raw parameters —
see the plain-English mapping below and `project_geography_cosmetic` sibling note.)

- **`model = "seat_and_hinterland"` (the default — Pattern B).** Every anchor's flood-grown region
  is its final county: a town/seat plus its rural surround. Minor centers were already absorbed in
  Step 1, so one county can legitimately contain **several towns** (e.g. Clark County WA = Vancouver
  + Camas + Battle Ground + unincorporated land). This is the most common real pattern.

- **`model = "city_county"` (Pattern A — *like San Francisco, Denver*).** For each **dominant**
  center (≥40%, Step 1), carve its dense core into its own county:
  - **Urban core county:** the contiguous precincts around the peak whose population ≥
    `core_density * peak_population` (default `core_density = 0.5`) — the "out to a certain density"
    cutoff — flood-grown from the peak so it stays compact. Raise `core_density` for a tighter
    city-county, lower it to let the city-county eat more suburb.
  - **Ring counties:** the remainder of that center's region, split into `ring_counties` counties
    (default `auto` — derived from secondary towns/sectors; e.g. scenario-002 wants 2 = west + east).
  This reproduces the consolidated-/independent-city pattern (dense core as its own unit) wrapped by
  separate suburban/rural counties. Mirrors Azgaar's province subdivision. No dominant center →
  degrades to `seat_and_hinterland`.

- **`model = "split_metro"` (Pattern C — *like Portland across Multnomah/Washington/Clackamas*).**
  Set `split_dense_center = true`: place **multiple seeds inside one large center** so county lines
  cut *through* the urban mass. Use when a single city has outgrown one county.

**Satellite towns are not a separate model.** A town like Vancouver WA (within the same state/region)
is just another settlement center — it gets its own county via Step 1 exactly like Gresham or
Beaverton would. Cross-state-line metros (Portland↔Vancouver WA) never co-occur here: a map is a
single region that never crosses a state line, so there is no cross-border districting to model.

### Step 4 — Cosmetic finish (optional, recommended)

- Render counties as dashed borders only (no gameplay effect).
- Because borders already prefer troughs and feature hexes (Step 2), they will visually align with
  rivers/ridgelines — the desired "looks right" effect and the safe way to *show* the
  river↔boundary association without making geography a rule (per `project_geography_cosmetic.md`).
- Optionally name each county after its seat precinct/settlement.

### Plain-English → preset mapping (breadcrumb for future tuning)

The owner won't recall raw knobs between sessions. Translate descriptions to settings:

| When the description is… | Set | Notes |
|---|---|---|
| "small town with rural land around it" | `model: seat_and_hinterland` | the default; minor towns share the county |
| "a county with several towns in it (Vancouver/Camas/Battle Ground)" | `model: seat_and_hinterland` | absorption (Step 1) puts multiple centers in one county |
| "the city *is* its own county, like San Francisco / Denver" | `model: city_county` | raise `core_density` to tighten the city-county |
| "city spread across several counties, like Portland" | `model: split_metro` | sets `split_dense_center: true` |
| "a satellite town like Vancouver WA (same state) gets its own county" | add a settlement | secondary anchors auto-get a county — no model change |

### Defaults summary (all tunable)

| Parameter | Default | Meaning / source |
|---|---|---|
| `model` | `seat_and_hinterland` | named preset: B (default) / `city_county` (A, SF/Denver) / `split_metro` (C, Portland) |
| `r` (catchment radius) | 2 hexes | day's-ride → size knob (RQ1; cell-count extrapolated) |
| target count | `precincts / 14` | ~4–7 @ r5, ~2–3 @ tutorial (extrapolated) |
| anchor threshold | 15–20% of `P_total` | town big enough to be a seat (extrapolated) |
| dominant threshold | 40% of `P_total` | triggers `city_county` core/ring split (extrapolated) |
| `core_density` | 0.5 × peak pop | "out to a certain density" urban-core cutoff (extrapolated) |
| `ring_counties` | `auto` | how many counties wrap a city-county's core (e.g. 2 for scenario-002) |
| `split_dense_center` | `false` | `true` = `split_metro` (seats placed inside one city) |
| `w_trough` | 0.5 | border bias toward population troughs |
| `w_feature` | 1.0 | border bias toward rivers/ridgelines (RQ4) |

### Principles (don't violate these when tuning)

- **Counties are unequal by design.** No equal population, area, or shape. `target count` only
  decides how many *seeds* to drop — it never balances them. Sanity is **local** ("does this county
  sensibly wrap its seat?"), never global ("are the counties balanced across the region?").
- **The region clips counties.** Precincts only exist inside the map; an edge county is simply
  truncated by the boundary and conceptually "continues off-map." A few truncated edge counties are
  expected and fine — a deliberate game simplification, not a bug to fix.
- **One county can hold several towns** (the Clark County case): not every settlement is a seat;
  sub-anchor centers are absorbed.

**Where this is grounded vs extrapolated:** the *structure* (area-catchment default, population
override for dominant centers, flood-fill from seats, borders snapping to troughs/features, one
algorithm + subdivision flag) is directly grounded in RQ1–RQ5 and Azgaar. The *specific numbers*
(`r=2`, 15%/40% cut points, `core_frac`, weights) are defensible extrapolations calibrated to our
small map sizes, not values pulled from a source — they should be tuned by eyeballing generated
1-center, 2-center, and 3-center fields.

---

## REFS

- Texas county count / day's ride: https://www.texastribune.org/2018/07/03/beto-orourke-visited-all-254-counties-texas-why-are-there-so-many/
- East vs west county size (Quora): https://www.quora.com/Why-are-counties-in-the-east-of-the-US-so-much-smaller-than-counties-in-the-west
- County size / Gold Rush founding era: https://letsgola.wordpress.com/2015/12/23/county-size/
- Wikipedia: County (United States): https://en.wikipedia.org/wiki/County_(United_States)
- Wikipedia: County statistics of the United States: https://en.wikipedia.org/wiki/County_statistics_of_the_United_States
- Census: Big and Small Counties: https://www.census.gov/library/stories/2017/10/big-and-small-counties.html
- Wikipedia: Consolidated city-county: https://en.wikipedia.org/wiki/Consolidated_city-county
- Wikipedia: Independent city (US): https://en.wikipedia.org/wiki/Independent_city_(United_States)
- National League of Cities: Consolidations: https://www.nlc.org/resource/cities-101-consolidations/
- VirginiaPlaces: Watersheds & political boundaries: http://www.virginiaplaces.org/watersheds/3political.html
- Azgaar DeepWiki: States and Provinces: https://deepwiki.com/Azgaar/Fantasy-Map-Generator/3.3-states-and-provinces
- Azgaar blog: Settlements/Regions: https://azgaar.wordpress.com/2017/11/21/settlements/
- Sibling prior-art doc (population/flood-fill machinery we reuse): thoughts/shared/research/2026-05-31-population-distribution-prior-art.md
