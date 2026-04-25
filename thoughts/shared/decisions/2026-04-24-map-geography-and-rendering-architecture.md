---
date: 2026-04-24
status: accepted
---

# ADR: Map Geography Model and Rendering Architecture

## Status

Accepted

## Context

Review of the precinct count calibration research surfaced several interconnected
design decisions about the geographic model, editing scope, and rendering strategy.
These were resolved through design discussion and are recorded here before
implementation begins.

## Decisions

### 1. Scenario region, not county, as the canonical playfield

The editable playfield is a **scenario region** — a set of precincts defined by the
scenario, not by administrative county boundaries. The scenario designer picks a
coherent region that makes the pedagogical point. This region will typically be
roughly county-sized (~300 precincts) but is not constrained to county lines.

County boundary changes are explicitly out of scope — they are extremely rare in the
US and the lesson (demographic/political change producing different outcomes) is better
taught through redistricting and population shift. Do not model county boundary changes.

### 2. Neighboring context precincts

A scenario includes both the editable region and read-only neighboring precincts that:
- Complete districts that extend beyond the editing boundary
- Participate in population balance calculations (so district population math is correct
  even when a district crosses the editing boundary)
- Are visible in the state-level view
- Are not editable by the player

Neighboring context precincts are first-class objects in the scenario data format —
not a rendering hack. The simulation always operates on the full district including
context precincts.

### 3. One election type per scenario

Congressional, state senate, and state house districts are entirely separate maps
drawn independently. A single precinct simultaneously belongs to a congressional
district, a state senate district, and a state house district — but these assignments
are unrelated to each other.

A scenario is therefore always about one specific election type. Redrawing congressional
districts does not affect state senate or house boundaries. A player cannot "redraw the
map" in a type-agnostic way.

Multiple election types may be shown as **read-only overlay views** on the same precinct
map — "here is how these same precincts are carved up differently for each election type"
— which is itself an educational point. But editing one type never changes another.

### 4. Pannable viewport: the editing window is mobile

The editing/rendering window is a viewport the player can pan (right-click-drag or
arrow keys). Precincts scroll in and out of view as the player pans. The state-wide
simulation always covers all precincts; the viewport constrains what is visible and
editable, not what is simulated.

Scenario scope is enforced by **scoring, not by hard boundaries**. The player can pan
freely and assign any precinct; the scenario grades them based on outcomes for the
election type and objectives defined in the scenario. A visual "focus zone" hint
indicates where the interesting action is without walling off the rest of the map.

### 5. Panning performance: CSS transform is smooth; interaction is the constraint

CSS transform panning (applying a CSS translate to the SVG container) is smooth at
60fps regardless of DOM node count — the browser composites the layer without
re-rendering. This is the panning implementation for SVG.

The binding constraint is **interaction performance** (hover, click, drag-to-paint),
not pan animation. Interaction degrades noticeably above ~1,000 SVG DOM nodes because
every off-screen node still participates in event hit-testing.

Implications:
- Scenarios with ≤800 total precincts (editable + context): pure SVG is viable
- Scenarios with >800–1,000 total precincts: Canvas+SVG hybrid is required

### 6. Rendering architecture: renderer-agnostic model with Canvas+SVG hybrid target

The simulation, data model, and scenario logic are **renderer-agnostic**. They do not
know about SVG or Canvas. The rendering strategy is a parameter of the map component.

The target rendering architecture for the pannable map:

- **Canvas layer**: draws the hex grid background for the current viewport each frame.
  Pan = redraw with a new offset. Fast at any precinct count; no DOM nodes.
- **SVG overlay**: sits on top of Canvas; contains only interactive elements for the
  current viewport (selected cells, district boundaries, hover state). Small node count;
  full D3 interactivity.

This is the pattern used by Leaflet/MapboxGL and handles arbitrary scale smoothly.

For v1, if the total scenario precinct count (editable + context) stays under ~800,
pure SVG is acceptable and simpler to implement. The Canvas+SVG hybrid should be
introduced when scenarios exceed that threshold — not before, not never.

The critical constraint: **do not hardwire the rendering to SVG-only**. The interface
boundary between the data/simulation layer and the rendering layer must exist from v1,
even if only one rendering strategy is implemented initially.

### 7. Geographic hierarchy in the data model

Every precinct knows what region it belongs to and what state that region is in.
The hierarchy is in the data model from v1 even if the state-level view is v2.

```
State
 └─ Region (scenario playfield; roughly county-sized; not admin-boundary-constrained)
     └─ Precinct (atomic unit; not subdivided)
```

State-level aggregation is: `state_result = sum(all_region_results)` where most regions
are pre-computed constants for the scenario and the player's region is live.

### 8. State-level view is explicit v2

The zoomed-out view showing the player's edited region in state context, with full
state electoral consequences visible, is a v2 feature. v1 plays within the scenario
region; the state-level view is deferred.

However, the data model (geographic hierarchy) and rendering interface (renderer-agnostic)
must not preclude it. Adding the state-level view in v2 should require adding a new
rendering mode, not refactoring the data model.

## Consequences

**Scenario data format**: ~~Must include `neighboring_context_precincts[]` alongside the
editable precinct set.~~ *Superseded by the scenario data format spec*: editable and
context precincts are merged into a single `precincts[]` array distinguished by
`editable: boolean`. The semantic distinction is preserved; the data shape is simpler.
Context precincts participate in simulation but are not editable.

**Simulation API**: Operates on the full set of precincts (editable + context). The
election type is a required parameter. `simulate(allPrecincts, assignments, electionType)`
→ `ElectionResult`.

**District assignment model**: Each precinct has `assignments: Map<ElectionType, DistrictId>`.
Not a single district ID. The active election type for a scenario determines which
assignment layer is being edited.

**Rendering interface**: `MapRenderer` is an interface/protocol. `SvgMapRenderer` and
`CanvasMapRenderer` are implementations. The scenario/game logic calls the interface;
it does not import SVG or Canvas specifics.

**Do not model**: county boundary changes; multi-type simultaneous editing.

### 9. County borders as rendering overlay (flavor, not mechanics)

County borders are drawn as a visual overlay for realism and geographic orientation.
They are mechanically inert — no game logic, simulation, scoring, or district
assignment depends on county membership. A precinct's county is metadata for display
only.

The rendering interface must support a county border overlay layer alongside the
existing district boundary overlay. These are independent visual layers; the player
can toggle each.

County membership is a precinct-level attribute in the data model (`precinct.county_id`)
so the renderer can draw county borders without any additional data structure. No
county-level aggregation or simulation is needed.

**Random map generation** (post-v1 / v2): when procedurally generating fictional
regions, generating county-like groupings of precincts is a secondary v2 goal —
adds realism without affecting simulation correctness. Not a v1 requirement.

**Explicitly not modeled**: county boundary changes (confirmed out of scope in
decision 1 above); county as an administrative unit with any game-mechanical effect.
