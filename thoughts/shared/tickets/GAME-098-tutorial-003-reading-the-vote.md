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

- [x] `tutorial-003.spec.yaml` authored (river, lean split, counties + urban core);
      `tutorial-003.json` generated. *(Coast deferred — see Progress.)*
- [x] `guided: true`; result panel + lean/county are `reveal` targets (hidden on load).
      *(City: pending GAME-096 — no `#filter-city` exists yet.)*
- [x] Guided script per DESIGN-012: lean + election result revealed in the same step, then
      county; the result updates live as districts are repainted. *(City step deferred.)*
- [x] Reuses GAME-076 engine + `reveal` action (no fork) — first use of `reveal`.
- [x] e2e: result panel + views hidden on load; each revealed as its step fires; result
      reflects the painted map; winnable by drawing three districts.

## Progress (2026-06-24) — DRAFT shipped, two deferrals

Shipped as a complete draft: a 91-precinct radius-5 map with an east/west partisan lean
(west 62% / centre 50% / east 37% Ken), a cosmetic river, two counties, and an urban core.
`guided: true`, `hide_election_results: false`, `hide_view_toolbar: false`. The `TUTORIAL_003`
overlay script (first use of `reveal`) hides the result panel + Lean + County on load and
surfaces them in sequence: orient → reveal Lean + result together → paint & watch → reveal
County → submit. Gates `district_count` only (result shown to read, not exploit); e2e covers
load/reveal/lean/county/winnability + the overlay walkthrough.

**Two deferrals (judgment calls, flagged for review):**
1. **City-view step** — needs the city-limits overlay (GAME-096), which isn't built. The map
   carries an urban core so the step slots in later without a map change. The overlay reveals
   Lean+result then County; City follows with GAME-096. **This ticket stays open for that step.**
2. **Coastline** — sea tiles must sit outside the precinct circle (the generator rejects
   overlaps), so the coast needs hand-placed outer-ring tiles best done in the visual pass.
   The river alone carries "some geography" for the draft.

## References

- Plan + DESIGN-012 (tutorial-003 script). GAME-076 — engine + `reveal` action.
- GAME-096 — city-limits overlay (prerequisite). GAME-077 — tutorial-002 (precedes this).
