---
date: 2026-04-24
researcher: claude (web-search-researcher)
branch: main
repository: cgruber/redistricting-sim
topic: precinct-count-calibration
tags: precincts, geography, performance, d3, svg
status: complete
last_updated: 2026-04-24
last_updated_by: claude
---

## Summary

Typical US counties have anywhere from under 10 precincts (rural) to ~3,700 (Cook County, IL).
For a fictional sub-state region the game's "hundreds" target is grounded: **200–400 precincts is
the right calibration sweet spot** — realistic for a mid-to-large county, learnable, and comfortably
within SVG's interactive performance envelope. SVG with D3 handles up to roughly 1,000 interactive
elements at acceptable frame rates; beyond that, Canvas becomes advisable, putting a hard design
ceiling at ~800–1,000 hex cells before switching rendering strategies would be required.

**Recommended nominal target: 300 precincts.**

## Real Precinct Counts

The contiguous US had approximately 177,600 voting precincts in 2020 across ~3,100 counties,
averaging roughly 57 per county — but averages are misleading because the distribution is extremely
skewed toward large urban counties.

| Geography | Scale | Approx. Precinct Count | Notes |
|---|---|---|---|
| Rural Wyoming county | Very small | Fewer than 10 | State-level data; rural counties often have 5–15 |
| Travis County, TX (Austin metro) | Mid-size urban | 247 (2020), 287 (2022) | Post-2020 redistricting plan |
| Cook County, IL (Chicago metro) | Large urban | ~3,668 | 2020 presidential election data |
| Los Angeles County, CA | Mega-county | ~4,000–5,000 (est.) | Dataset on data.lacounty.gov |

Key context:
- Average US precinct serves roughly 800–900 voters (2016–2020)
- State law shapes maximum precinct size: Ohio caps precincts at 1,400 electors
- The NYT's "Hexapolis" educational game used 135 hexagonal precincts — intentionally simplified
  for a quick-play puzzle; an educational sim aiming for more depth warrants roughly double

## Game Target Recommendation

**Recommended target: 250–350 precincts, with 300 as the nominal design number.**

Rationale:

1. **Realism anchor**: Travis County (Austin) at 247–287 precincts is the most useful calibration
   example — politically contested mid-size county, validates "a few hundred" as a recognizable
   real-world scale.

2. **Learnability**: At 300 hexes, players can perceive individual cells without needing to zoom.
   Redistricting mechanics (packing/cracking, compactness, population equality) become visible
   patterns at this scale.

3. **Scenario flexibility**: 300 precincts supports 5–10 districts of 30 precincts each, or 3–4
   larger districts of 75–100 precincts. This allows varied scenario designs without the map
   feeling sparse or impossibly dense.

4. **Performance headroom**: 300 SVG hexagons with mouse event listeners is well within the
   comfortable SVG zone, leaving room for future feature additions without hitting a wall.

5. **Upper bound caution**: Scenarios above 500 precincts should be tested on mid-range hardware
   before shipping. Scenarios above ~700 should be considered for Canvas migration.

## SVG/D3 Performance at Scale

Community consensus and benchmarks converge on a consistent threshold:

**SVG is comfortable up to ~1,000 interactive elements.** Beyond that, frame rates degrade noticeably.

- D3 community and Scott Logic performance articles: SVG handles ~1,000 datapoints before
  observable slowdown. A scene with 1,000 SVG elements can render 3x slower than one with 100.
- Attaching mouseover/click/drag handlers to thousands of DOM nodes creates compounding memory
  pressure — each hex cell being a full DOM node is the key cost.
- Reintech's D3 performance guide: 1,000–5,000 points with optimized SVG + data simplification
  can maintain 30–60 fps; 5,000–50,000 requires Canvas + viewport culling for 60 fps.
- Canvas can render ~10,000 datapoints at smooth 60 fps where SVG is already struggling at
  2,000–3,000 elements.
- Reducing SVG element count by 30% can yield up to 50% rendering speed improvement.

**Canvas crossover point**: 1,000–2,000 interactive SVG elements. The switch can deliver
10–100x performance improvement but sacrifices D3's native DOM interactivity (requiring manual
hit-testing on Canvas). A hybrid approach — Canvas for the hex grid render layer, SVG overlay
for labels and selection highlights — is the recommended pattern when element counts exceed
comfortable SVG range.

## Implications for Game Design

**Map generator:**
- Target 300 nominal precincts. The generator should be parameterized (e.g., `PRECINCT_COUNT = 300`)
  so scenarios can dial up to 500 or down to 150 for tutorial/intro maps.
- Hex geometry should treat each cell as a single `<polygon>` or `<path>`. Avoid composing each
  hex from multiple SVG sub-elements (borders, fills, labels as separate nodes) — that multiplies
  DOM node count by 3–5x unnecessarily.
- District coloring should use CSS class toggling or D3 `.attr("fill", ...)` rather than inline
  style attributes, enabling browser style-batching.

**Rendering strategy:**
- For v1, pure SVG is the right call at 300 precincts. Simple, debuggable, D3's selection model
  maps cleanly to the game's interaction model (click-to-assign, hover-to-highlight).
- Add a Canvas fallback path or hybrid renderer as a v2 consideration, triggered if precinct count
  exceeds 600.
- Avoid attaching per-cell mouseover listeners at initialization; use event delegation (one listener
  on the SVG container, use `event.target` to identify hex) to reduce memory overhead.
- Geometric zoom (CSS transform on the SVG viewport) is significantly faster than semantic zoom
  (updating every element's attributes on zoom).

**Scenario design:**
- 300 precincts supports 6–12 distinct scenario configurations without the map feeling repetitive.
- Intro/tutorial scenarios at 100–150 precincts will render fast and give new players a low-stakes
  surface to learn mechanics.
- The hardest scenarios (large complex metro) can go to 400–500 precincts without leaving SVG's
  safe zone, but should be QA-tested on lower-end devices.

## Sources

- [How Many Voting Precincts Are in the United States in 2025](https://prep.carcentinel.com/quick-focus/voting-precincts-us-2025-1769550440)
- [American election results at the precinct level — Scientific Data / Nature](https://www.nature.com/articles/s41597-022-01745-0)
- [United States Precinct Boundaries and Statewide Partisan Election Results — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11522301/)
- [US Elections Project — Precinct Data](https://www.electproject.org/election-data/precinct-data)
- [Public Notice: Travis County Election Precinct Boundaries Proposed Plan For 2022](https://www.traviscountytx.gov/news/2021/2168-public-notice-travis-county-election-precinct-boundaries-proposed-plan-for-2022)
- [Suburban Cook Election Precincts — Cook County Open Data](https://datacatalog.cookcountyil.gov/Boundaries-Districts/Suburban-Cook-Election-Precincts-Current/k7sw-w3b8)
- [D3 SVG Chart Performance — Scott Logic Blog](https://blog.scottlogic.com/2014/09/19/d3-svg-chart-performance.html)
- [Rendering One Million Datapoints with D3 and WebGL — Scott Logic Blog](https://blog.scottlogic.com/2020/05/01/rendering-one-million-points-with-d3.html)
- [Learnings from a D3.js addict on starting with Canvas — Visual Cinnamon](https://www.visualcinnamon.com/2015/11/learnings-from-a-d3-js-addict-on-starting-with-canvas/)
- [Optimizing D3 Chart Performance for Large Data Sets — Reintech](https://reintech.io/blog/optimizing-d3-chart-performance-large-data)
- [SVG vs Canvas — LogRocket Blog](https://blog.logrocket.com/svg-vs-canvas/)
- [Planning for Performance — Using SVG with CSS3 and HTML5 (O'Reilly)](https://oreillymedia.github.io/Using_SVG/extras/ch19-performance.html)
- [Hexapolis / Setting up Hexapolis — Observable Forum](https://talk.observablehq.com/t/setting-up-hexapolis/6163)
