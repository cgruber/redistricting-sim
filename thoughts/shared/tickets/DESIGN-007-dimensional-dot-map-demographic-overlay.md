---
id: DESIGN-007
title: Dimensional dot map — demographic dimension overlay and sorted placement toggle
area: design, rendering
status: open
created: 2026-04-27
---

## Summary

Extend the population dot density overlay (DESIGN-005) to encode an active demographic
dimension via dot color, using Option B adaptive encoding (see ADR
`thoughts/shared/decisions/2026-04-27-dimensional-dot-map-design.md`). Add a sorted
placement toggle so players can switch between random scatter (default) and grouped
placement (micro-bar-chart effect for zoomed-in precision work).

This is the implementation ticket for the decisions recorded in the ADR above.
Depends on DESIGN-005 (base dot overlay must be in place first).

## Current State

DESIGN-005 (once implemented) will render dots with a fixed hue-aware color (light or
dark depending on district hue brightness). No demographic dimension switching exists.
Dot placement is random/deterministic per precinct but not sorted.

## Goals / Acceptance Criteria

### Dimension type taxonomy

- [ ] Scenario JSON supports a `dimension_type` field (`"categorical"`, `"scalar"`, or
  `"modifier"`) on demographic group/dimension definitions
- [ ] Loader validates `dimension_type` and rejects unknown values

### Categorical mode (race, party affiliation, etc.)

- [ ] When a categorical dimension is active, each dot within a hex is colored by the
  demographic group it represents
- [ ] Dot count per group within a hex is proportional to that group's share of the
  precinct population
- [ ] Palette: Paul Tol Bright or Okabe-Ito; maximum 5 simultaneous hues; 1px white
  outline on all dots to separate from district fill
- [ ] Colors remain distinguishable under deuteranopia / protanopia simulation

### Scalar mode (income, age, etc.)

- [ ] When a scalar dimension is active, all dots in a hex share a single sequential
  single-hue color mapped to the precinct's average scalar value
- [ ] Color ramp is single-hue (e.g. light-to-dark blue) to avoid hue interference with
  district fills
- [ ] Legend shows the sequential ramp with min/max labels

### Modifier mode (voter turnout)

- [ ] When a modifier dimension is active, dot count per hex is scaled by the modifier
  value (e.g. dot count = population × turnout rate)
- [ ] Dot color reverts to neutral (hue-aware light/dark from DESIGN-005 base behavior)
- [ ] Legend explains the modifier interpretation ("dots represent likely voters")

### Sorted placement toggle

- [ ] A toggle button (or keyboard shortcut) switches between random and sorted dot
  placement within each hex
- [ ] Sorted mode: dots are grouped by categorical dimension (deterministic sort by
  group name or index) — produces an embedded micro-bar-chart effect
- [ ] Sorted mode applies only in categorical mode; random placement is always used in
  scalar and modifier modes
- [ ] Toggle state persists through pan/zoom re-renders (not reset on zoom)
- [ ] Default: random

### Lean Dot view (temporary experimental mode)

A third view mode — **Lean Dot** — is added alongside Districts and Partisan Lean as an
explicit A/B comparison surface. It renders flat district fills + party-hue dots for the
partisan dimension. The existing Partisan Lean view (RdBu fill, no dots) is unchanged.

After evaluation, the weaker encoding will be removed. This mode is explicitly marked
temporary; do not invest in polish.

- [ ] View toggle cycles Districts → Partisan Lean → Lean Dot (→ Districts…)
- [ ] Lean Dot view: flat district fills + categorical dot layer with party dimension active
- [ ] Lean Dot view is visually labelled as experimental (e.g. "Lean (Dot) ⚗" or similar)
- [ ] Partisan Lean view is unchanged — no dots added

### Dimension switching UI

- [ ] A dimension selector (buttons or dropdown) lets the player switch between
  available demographic dimensions
- [ ] "No overlay" is always available as an option (returns to plain population dots
  from DESIGN-005)
- [ ] Switching dimension re-renders the dot layer without flickering or full page reload
- [ ] Active dimension is visually indicated in the selector

### Legend

- [ ] Categorical: legend shows each group color with its label
- [ ] Scalar: legend shows sequential ramp with min/max labels
- [ ] Modifier: legend shows explanation text
- [ ] "No overlay" / population-only: legend omitted or shows "Population density"

## Test Coverage

- [ ] Unit: `dimension_type` validation — accepts `categorical`, `scalar`, `modifier`;
  rejects unknown values
- [ ] Unit: categorical dot color assignment — given precinct group distribution,
  produces correct group-color dot counts
- [ ] Unit: sorted placement — given a seed and group counts, sorted output groups dots
  by group index deterministically
- [ ] e2e: switching to a categorical dimension changes dot colors in the SVG
- [ ] e2e: switching to scalar mode changes all dots to a single-hue ramp color
- [ ] e2e: switching to "No overlay" returns dots to hue-aware neutral color
- [ ] e2e: sorted toggle button changes dot grouping within a hex (check DOM order or
  data attributes)
- [ ] e2e: Lean Dot view shows dots; Partisan Lean view does not show dots

## Notes

- The sorted toggle is most valuable when zoomed in. Consider auto-gating
  (auto-sort at high zoom, auto-random at overview) as a DESIGN-006 follow-on.
- Option F (dot size = scalar, dot color = categorical simultaneously) is explicitly
  deferred to v1.1 per the ADR. Do not implement or scaffold it here.
- The dimension selector UI placement: floating control panel, top-right of the map
  canvas, or integrated into the existing header/menu bar. Separate from the legend
  (DESIGN-004). Legend = bottom of map, color context only. Controls = top-right,
  separate floating widget or header. Exact placement to confirm during implementation.
- At most 5 categorical groups can be shown simultaneously with the colorblind-safe
  palette constraint. If a scenario has >5 groups, the rendering must bucket or
  merge low-frequency groups into an "Other" category.

## References

- ADR: `thoughts/shared/decisions/2026-04-27-dimensional-dot-map-design.md`
- Research: `thoughts/shared/research/2026-04-27-dimensional-dot-map-design-research.md`
- DESIGN-005 — base dot density overlay (prerequisite)
- DESIGN-006 — zoom-adaptive dot scaling (parallel; sorted-toggle auto-gating may
  merge into DESIGN-006)
- DESIGN-004 — legend layout (coordinate on dimension selector placement)
- `game/web/src/render/mapRenderer.ts` — dot rendering entry point
- `game/web/src/model/scenario.ts` — scenario JSON types (add `dimension_type`)
