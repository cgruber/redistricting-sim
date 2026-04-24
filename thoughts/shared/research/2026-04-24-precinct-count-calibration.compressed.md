<!--COMPRESSED v1; source:2026-04-24-precinct-count-calibration.md-->
§META
date:2026-04-24 researcher:claude(web-search-researcher) branch:main repo:cgruber/redistricting-sim
topic:precinct-count-calibration tags:precincts,geography,performance,d3,svg status:complete

§SUMMARY
Target 300 nominal precincts (range 250–350). Travis County TX (247–287 precincts) is the
real-world calibration anchor for a mid-size sub-state region. SVG+D3 is comfortable to ~1,000
interactive elements; 300 is well within safe zone with room for feature growth. Canvas crossover
at ~1,000–2,000 elements; hybrid Canvas+SVG-overlay recommended above 600 precincts.

§REAL_COUNTS
US total: ~177,600 precincts across ~3,100 counties (2020); avg 57/county but skewed
Examples:
  rural Wyoming county: <10
  Travis County TX (Austin metro): 247 (2020) → 287 (2022)
  Cook County IL (Chicago): ~3,668
  LA County CA: ~4,000–5,000 est.
Avg precinct: 800–900 voters; NYT Hexapolis: 135 hexes (intentionally minimal)

§TARGET
300 nominal | param: PRECINCT_COUNT so scenarios can dial 150 (tutorial) → 500 (hard)
Rationale: Travis County anchor; learnability (cells visible without zoom); scenario flex
(5–10 dists of 30–60 pcs); perf headroom; >500 → test on mid-range HW; >700 → Canvas

§SVG_PERF
Comfortable: ≤1,000 interactive elements | Starts degrading: 1,000–2,000
Canvas crossover: 1,000–2,000 (10–100x improvement; loses DOM interactivity → manual hit-test)
Hybrid pattern: Canvas render layer + SVG overlay for labels+selection (recommended >600 pcs)
Key optimizations: event delegation (not per-cell listeners); geometric zoom (CSS transform
  not attribute mutation); CSS class toggling for recolor (not inline style)
1 pc = 1 <polygon>|<path> — do NOT compose from sub-elements (multiplies node count 3–5×)

§IMPLICATIONS
Map gen: parameterize count; 1 SVG element/pc; CSS class for fill; event delegation
Rendering: pure SVG for v1 @300; Canvas v2 fallback if >600
Scenarios: tutorial @100–150; hard scenarios @400–500 (QA on low-end HW)

§REFS
Travis County precinct plan: traviscountytx.gov/news/2021/2168-...
Cook County data: datacatalog.cookcountyil.gov
Scott Logic D3 SVG perf: blog.scottlogic.com/2014/09/19/d3-svg-chart-performance.html
Duchin hex geometry: ar5iv.labs.arxiv.org/html/1808.05860
LogRocket SVG vs Canvas: blog.logrocket.com/svg-vs-canvas/
