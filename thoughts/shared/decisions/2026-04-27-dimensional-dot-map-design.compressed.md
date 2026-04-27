<!--COMPRESSED v1; source:2026-04-27-dimensional-dot-map-design.md-->
§META
date:2026-04-27 status:accepted

§ABBREV
ts=thoughts/shared res=$ts/research dec=$ts/decisions

§CONTEXT
Districts view: population dot overlay (DESIGN-005) + demographic dimension encoding open question.
Two questions: (1) how dot color encodes active dimension; (2) random vs. sorted placement.
Research: $res/2026-04-27-dimensional-dot-map-design-research.md

§DECISIONS

**1. Option B — Adaptive Encoding by Dimension Type**
Dot color adapts to dimension's data type:

| type | dot encoding | examples |
|---|---|---|
| categorical | dot color per group, count ∝ group share | race, party |
| scalar | sequential single-hue per precinct avg | income, age |
| modifier | dot count = turnout-adjusted pop, neutral color | voter turnout |

dimension_type declared in scenario JSON → rendering engine branches on it; no per-group heuristics.
District fills stay flat (DESIGN-003). Dot color is independent channel.

Rejected: A(no encoding), C(partisan-only), D(hex halo—too busy), E(sidebar-only), F(size+color—deferred v1.1; 3-4 ordinal steps only at 2-6px radius; needs tutorial support)

**2. Sorted Placement Toggle**
Default: random within hex interior (seeded by precinctId → deterministic).
Toggle: sorted mode → dots grouped by categorical dimension → micro-bar-chart effect.
Use: sorted best when zoomed in for fine assignment work; random better at overview.
Future: may auto-gate by zoom level; launches as always-available control.

**3. Palette + Accessibility**
Paul Tol Bright | Okabe-Ito; ≤5 hues; 1px white outline on all dots.
Tooltip = authoritative data carrier (keyboard-focusable).

§CONSEQUENCES
scenario JSON: dimension_type field per group|dimension
render engine: branches on dimension_type; 3 modes only
sorted: needs deterministic sort key (group name|index)
Option F addable later without rearchitecting dot layer

§REFS
$res/2026-04-27-dimensional-dot-map-design-research.md
$res/2026-04-27-design-003-color-encoding-research.md
DESIGN-005 (base layer) | DESIGN-007 (impl ticket)
