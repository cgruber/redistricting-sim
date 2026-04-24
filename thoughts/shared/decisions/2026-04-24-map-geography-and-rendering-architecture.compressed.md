<!--COMPRESSED v1; source:2026-04-24-map-geography-and-rendering-architecture.md-->
§META
date:2026-04-24 status:accepted
topic:map geography model + rendering architecture

§ABBREV
pc=precinct dist=district ET=election-type

§DECISIONS

1. Scenario region not county
  Playfield = scenario-defined set of $pcs; not constrained to admin county boundaries
  County boundary changes: explicitly OUT OF SCOPE (rare IRL; lesson covered by other mechanics)

2. Neighboring context $pcs
  Scenario includes editable $pcs + read-only context $pcs that complete cross-boundary $dists
  Context $pcs: participate in population balance; visible in state view; not editable
  First-class in scenario data format; simulation operates on full set (editable+context)

3. One $ET per scenario
  Congressional/state-senate/state-house = completely separate maps; editing one ≠ changes others
  Scenario always has one $ET; multiple $ETs as read-only overlay views only (educational point)

4. Pannable viewport
  Player pans (right-click-drag|arrows); $pcs scroll in/out of view
  Simulation = always statewide; viewport constrains visible+editable, not simulated
  Scope enforcement = scoring not hard boundary; visual "focus zone" hint; no wall

5. Panning perf: CSS transform smooth; interaction is constraint
  CSS transform on SVG = 60fps pan regardless of node count (browser composites layer)
  Interaction (hover/click/paint) degrades at >~1,000 SVG DOM nodes (off-screen still hit-tested)
  ≤800 total $pcs (editable+context): pure SVG viable
  >800–1,000 total $pcs: Canvas+SVG hybrid required

6. Renderer-agnostic model + Canvas+SVG hybrid target
  Simulation/data/scenario = renderer-agnostic; no SVG/Canvas imports outside rendering layer
  Target architecture:
    Canvas layer: hex grid background; pan=redraw with offset; fast at any count; no DOM nodes
    SVG overlay: interactive elements for current viewport only; small node count; D3 interactivity
  v1: pure SVG if ≤800 $pcs; Canvas+SVG when scenarios exceed threshold
  CRITICAL: MapRenderer = interface; SvgMapRenderer/CanvasMapRenderer = implementations
    do NOT hardwire rendering to SVG-only; interface boundary must exist from v1

7. Geographic hierarchy in data model (from v1)
  State → Region(scenario playfield) → Precinct
  Even if state-level view is v2, hierarchy in data model from day 1
  State result = sum(all_region_results); most regions pre-computed; player's region live

8. State-level view = explicit v2
  Zoomed-out view showing edited region in state context = v2
  Data model + rendering interface must not preclude it; adding it = new rendering mode, not refactor

§CONSEQUENCES
Scenario format: neighboring_context_precincts[] first-class field
Simulation API: simulate(allPrecincts, assignments, electionType) → ElectionResult
District assignment: pc.assignments: Map<ElectionType, DistrictId> (not single ID)
Rendering: MapRenderer interface; SVG+Canvas as implementations
NOT modeled: county boundary changes; multi-type simultaneous editing

§REFS
Research: thoughts/shared/research/2026-04-24-precinct-count-calibration.md
Simulation ADR: thoughts/shared/decisions/2026-04-24-election-simulation-architecture.md
