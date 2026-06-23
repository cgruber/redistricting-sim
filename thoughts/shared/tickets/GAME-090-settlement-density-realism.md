---
id: GAME-090
title: Settlement density realism — plateau cores, non-circular shape, leapfrog developments
area: game, tooling
status: open
created: 2026-06-23
---

## Summary

Real settlement density is not a smooth monocentric cone — it's a **dense core
plateau + a sharp urban edge + a low rural floor (5–10× ratio) + scattered
leapfrog developments** beyond the edge. Captured from playtesting GAME-088:
a pure radial gradient reads as artificial ("a stable slope"); the eye expects a
core, established neighborhoods, a hard-ish boundary, and the odd new subdivision
popping up a precinct or two past the edge.

## Current State (what already landed in GAME-088)

- `gradient` (macro tilt), `contrast` (dynamic-range / pow), `target_total`
  (normalize) — gives the big urban/rural ratio (scenario-002 runs ~12×).
- `profile: plateau` on settlements — flat top within the inner half-radius, then
  a linear drop to a sharp edge (vs the smooth `gaussian`). Reads as a core.
- **Non-circular cores** are achievable today by overlapping multiple plateau
  settlements (scenario-002 = centre + a (1,-1) lobe → the core fans out).

## Goals / Acceptance Criteria (remaining work)

- [ ] **Leapfrog / exurban developments**: a spec feature that scatters N elevated
      precincts just beyond the urban edge (stochastic, seeded), breaking the
      clean boundary the way real new subdivisions do.
- [ ] Optional: a sharper plateau edge knob (edge exponent) for steeper shoulders.
- [ ] Optional: convenience for non-circular cores without hand-authoring multiple
      settlements (e.g. an elongation / multi-anchor settlement).
- [ ] Apply to the tutorial migrations and any scenario that wants a real city.

## References

- Plan: `thoughts/shared/plans/2026-06-22-generation-quality-overhaul.md`
- Built on GAME-088 (population field) + GAME-089 (counties).
- Philosophy: pipeline = initial-state generator, hand-tweaked for pedagogy.
- Back-burner stretch: a transformer trained on real cities (deferred — needs
  large training-data creation + validation).
