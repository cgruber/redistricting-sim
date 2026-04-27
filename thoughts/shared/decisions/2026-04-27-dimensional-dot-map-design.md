---
date: 2026-04-27
status: accepted
---

# ADR: Dimensional Dot Map — Demographic Overlay Design

## Status

Accepted

## Context

The Districts view needs to convey the spatial shape of population concentrations (not
just totals) and, when a demographic dimension is active, communicate how that
dimension is distributed across the map. Two design questions were open:

1. **How should dot color encode an active demographic dimension?** Six options were
   researched (A–F), ranging from no encoding to simultaneous size+color bivariate
   encoding.

2. **Should dots be placed randomly or sorted by type within each hex?** Random is the
   cartographic standard; sorted placement acts like an embedded micro-bar chart.

Research document: `thoughts/shared/research/2026-04-27-dimensional-dot-map-design-research.md`

## Decisions

### 1. Option B — Adaptive Encoding by Dimension Type

Dot color encoding adapts to the data type of the active demographic dimension:

| Dimension type | Dot encoding | Examples |
|---|---|---|
| `categorical` | dot color per group, count proportional to group's share | race, party affiliation |
| `scalar` | all dots same sequential single-hue color per precinct average | income, age, turnout rate |
| `modifier` | dot count = turnout-adjusted population, neutral dot color | voter turnout count |

The dimension type is declared in the scenario JSON alongside the demographic group
definition. This gives the rendering engine a principled rule: no per-dimension
rendering heuristics, just three well-defined modes.

District fills remain flat (DESIGN-003 decision). Dot color is an independent channel —
no hue/lightness interference with district identity.

**Rejected alternatives:**
- Option A (no demographic encoding): loses the spatial shape of the demographic
  distribution entirely; defeats the purpose of the overlay.
- Option C (partisan lean only): not generalizable; hardcodes a single dimension.
- Option D (hex halo/ring): three simultaneous channels (fill + dots + ring); too
  visually busy for general audiences.
- Option E (sidebar only): same attention gap that motivated the dot overlay design.
- Option F (size + color simultaneously): deferred to v1.1. At 2–6px dot radius,
  only 3–4 ordinal size steps are perceptually legible; general audiences require
  tutorial support to decode dual encoding correctly. Viable in principle but premature.

### 2. Sorted Placement Toggle

Dot placement defaults to **random** within the hex interior (seeded by precinct ID
for determinism across re-renders). This preserves the population-distribution
metaphor: a random scatter of dots represents people distributed across the precinct.

A **sorted toggle** is also provided. In sorted mode, dots are grouped by their
categorical dimension (e.g. all group-A dots first, then group-B, etc.) within each
hex. This produces an embedded micro-bar-chart effect that makes proportions more
legible when zoomed in for fine-grained work. Sorted mode is most useful during
close precinct-by-precinct assignment decisions, less useful at whole-map overview.

The toggle may be zoom-gated in a future refinement (auto-sort at high zoom,
auto-random at low zoom), but launches as an always-available user control.

### 3. Palette and Accessibility

- Categorical dot palette: Paul Tol Bright or Okabe-Ito (both colorblind-safe);
  maximum 5 simultaneous hues.
- All dots have 1px white outline to ensure separation from the district fill.
- Tooltip remains the authoritative data carrier (keyboard-focusable) for users
  who cannot distinguish dot colors.

## Consequences

- Scenario JSON needs a `dimension_type: "categorical" | "scalar" | "modifier"` field
  on each demographic group (or at the dimension/axis level if multiple groups share
  a dimension).
- The rendering engine branches on `dimension_type` to select the dot-color encoding
  mode; no per-group heuristics needed.
- Sorted placement requires a deterministic sort key (group name or group index) so
  the layout is stable across re-renders.
- Option F (bivariate size+color) can be added later without rearchitecting the dot
  layer — it is an additive encoding on top of the categorical mode.

## References

- `thoughts/shared/research/2026-04-27-dimensional-dot-map-design-research.md`
- `thoughts/shared/research/2026-04-27-design-003-color-encoding-research.md`
- DESIGN-005 — population dot density overlay (base layer)
- DESIGN-007 — implementation ticket for this design
