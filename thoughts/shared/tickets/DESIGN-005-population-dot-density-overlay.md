---
id: DESIGN-005
title: Population dot density overlay on district map
area: design, rendering
status: open
created: 2026-04-27
---

## Summary

Add a dot density overlay to the Districts view so players can perceive the spatial
shape of population concentrations at a glance. Dots are placed within each precinct
hex; dot count is proportional to the precinct's population. This addresses the
"attention gap" — the sidebar panel gives population totals, but does not let the
player see where people live spatially across the whole map simultaneously.

District fills remain flat (DESIGN-003 decision). Dots use a separate visual channel
(mark count) so there is no hue/lightness interference.

## Current State

Districts view uses a lightness gradient that was removed (DESIGN-003). No spatial
population representation exists on the map canvas.

## Goals / Acceptance Criteria

- [ ] Each precinct hex displays N dots proportional to its population (0 dots at
  minimum population precinct, up to ~6 dots at maximum population precinct)
- [ ] Dot count uses a linear scale across the scenario's precinct population range
- [ ] Dot color adapts to district hue brightness: dark district hues → light/white dots;
  light/pastel district hues → dark dots (threshold: d3.hsl(color).l > 0.5)
- [ ] Dots are small (≤3px radius) and placed within the hex interior without clipping
- [ ] Dot positions are deterministic per precinct (seeded by precinct ID) so they
  don't re-randomize on re-render
- [ ] Dots are rendered in the Districts view only; Partisan Lean view is unaffected
- [ ] A colorblind-safe 8-hue qualitative palette (Paul Tol Bright or ColorBrewer Set2)
  replaces the current ad-hoc DISTRICT_COLORS at the same time
- [ ] Both a "dark" palette variant and a "light/pastel" variant are defined; the
  dot-color logic is tied to which palette is active

## Test Coverage

- [ ] e2e: dot elements are present in the SVG after scenario loads
- [ ] e2e: precinct with highest population has more dots than precinct with lowest
- [ ] e2e: dots are absent in Partisan Lean view

## Notes

- Dot positions: place randomly within a circle of radius ~0.6 × hex_radius centered
  on the hex center. This avoids needing per-hex SVG clipPath elements.
- Dot count scale: map normPop (0–1) to integer dot count via Math.round(normPop * MAX_DOTS)
  where MAX_DOTS = 6 for v1.
- Deterministic placement: use a simple seeded PRNG (e.g. mulberry32 with seed=precinctId)
  so positions are stable across re-renders.
- Zoom-adaptive scaling is intentionally deferred to DESIGN-006.
- Demographic overlay via dot color is DESIGN-007 (dimensional dot map, Option B adaptive
  encoding). This ticket establishes the base dot layer (population-only) that DESIGN-007
  builds on.

## References

- DESIGN-003 (superseded) — flat fill decision
- DESIGN-006 — zoom-adaptive dot scaling (refinement, possibly post-v1)
- `game/web/src/render/mapRenderer.ts` — hexFill(), hex rendering
- `game/web/src/model/types.ts` — DISTRICT_COLORS
- Research: thoughts/shared/research/2026-04-27-design-003-color-encoding-research.md
