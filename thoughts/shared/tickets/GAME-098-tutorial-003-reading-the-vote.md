---
id: GAME-098
title: Tutorial-003 "Reading the Vote" — lean view + election result (paired) + county/city
area: game, UX, tutorial, content
status: open
created: 2026-06-24
---

## Summary

Author tutorial-003, the **first electoral layer** of the tutorial arc: unveil the
**election-result panel together with the lean view** (lean shows where voters lean; the
result shows who wins each district — they're a causal pair), then the county and city
map-reading views. Reuses the overlay engine (GAME-076) and exercises the `reveal` action
for the first time. This is where the deliberately-hidden electoral UI is introduced.

Arc + script: see DESIGN-012 (tutorial-003 step script) and
`thoughts/shared/plans/2026-06-24-tutorial-redesign-pipeline-migration.md`.

## Approach — design locked with user

- **Map (pipeline):** terrain (river + coast), **partisan lean** (an east/west split so the
  Lean view + result are meaningful), 2–3 counties + an urban core (so county/city overlays
  have something to draw).
- **Flags:** `guided: true`, `hide_election_results: false`, `hide_view_toolbar: false`.
  The **reveal targets** start hidden and are surfaced by the script: the election-result
  panel (`#results-heading` + `#results-container`) and `#filter-lean` revealed **together**
  in one step; then `#filter-county`, then `#filter-city`.
- **Objective stays mechanical** (gates on `district_count`): the result is shown to *read*
  ("repaint and watch it move"), not yet to exploit — strategy is the capstone + real
  scenarios. Keeps the "no untaught failure modes" rule.
- **Prerequisite:** GAME-096 (city-limits overlay) for the City view step.

## Goals / Acceptance Criteria

- [ ] `tutorial-003.spec.yaml` authored (terrain, lean split, counties + urban core);
      `tutorial-003.json` generated.
- [ ] `guided: true`; result panel + lean/county/city are `reveal` targets (hidden on load).
- [ ] Guided script per DESIGN-012: lean + election result revealed in the same step, then
      county, then city; the result updates live as districts are repainted.
- [ ] Reuses GAME-076 engine + `reveal` action (no fork).
- [ ] e2e: result panel + views hidden on load; each revealed as its step fires; result
      reflects the painted map; winnable by drawing the required districts.

## References

- Plan + DESIGN-012 (tutorial-003 script). GAME-076 — engine + `reveal` action.
- GAME-096 — city-limits overlay (prerequisite). GAME-077 — tutorial-002 (precedes this).
