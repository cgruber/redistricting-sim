---
id: GAME-077
title: Tutorial-002 "A Legal Map" — contiguity + balanced population (guided)
area: game, UX, tutorial, content
status: resolved
created: 2026-05-18
---

## Summary

Author tutorial-002 as the second guided walkthrough: introduce the **structural rules** —
contiguity + balanced population — and the **validity panel** that reports them. Reuses the
overlay engine (GAME-076). Still **pre-electoral**: no views, no election result.

Re-scoped 2026-06-24: the "views / lean / county / city" lesson moved to **tutorial-003**
(GAME-098, "Reading the Vote"), where it's paired with the election result. This ticket is
now the "make a legal map" lesson. See the revised step script in DESIGN-012 and the arc in
`thoughts/shared/plans/2026-06-24-tutorial-redesign-pipeline-migration.md`.

## Approach — design locked with user

- **Map (pipeline):** slightly bigger than T1 (e.g. `hex_circle` r=4 ≈ 61 precincts,
  3 districts). Population deliberately uneven enough that balancing is a real (but gentle)
  task. Neutral demographics (no partisan signal — pre-electoral).
- **Gates on `district_count` + `population_balance` + contiguity** — the first tutorial
  where balance/contiguity are enforced. So `rules.contiguity: required`, a
  `population_balance` criterion (generous-ish tolerance), and the **validity panel shows**
  (applicable-aware: it renders because these are now enforced).
- **Flags:** `guided: true`, `hide_election_results: true`, `hide_view_toolbar: true`
  (no views yet; the result panel stays hidden — that's tutorial-003's reveal).
- **Guided script (DESIGN-012):** orient to the two rules → paint → highlight the validity
  panel → even out + connect until green → submit. The validity panel is the star.

## Goals / Acceptance Criteria

- [x] `tutorial-002.spec.yaml` authored; `tutorial-002.json` generated via the pipeline.
- [x] Enforces balance + contiguity (criterion + `contiguity: required`); validity panel shows.
- [x] `guided: true` + `hide_election_results: true` + `hide_view_toolbar: true`.
- [x] Guided script per DESIGN-012; reuses GAME-076 engine (no fork).
- [x] Skip / persist consistent with T1 (`tutorial-tutorial-002-complete`).
- [x] e2e: winnable by drawing balanced + contiguous districts; an unbalanced/disconnected
      attempt fails and the validity panel flags it; views/result panels absent.

## Resolution (2026-06-24)

Shipped. `tutorial-002.spec.yaml` → `tutorial-002.json`: a radius-4 hex-circle (61 precincts),
three districts, a densely-settled town in the north on a flat rural base (`settlements`, no
gradient). Gates on `district_count` + `population_balance` (tolerance 0.12) with
`rules.contiguity: required`; the validity panel shows (applicable-aware). Flags `guided: true`
+ `hide_election_results: true` + `hide_view_toolbar: true`. The 5-step DESIGN-012 script is
registered in `overlay.ts` (`TUTORIAL_002`), reusing the GAME-076 engine. Winning move (verified
balanced + contiguous via BFS): compact northern cap as D1 (~70.5k), rural south split west/east
into D2 (~68.8k) / D3 (~59.9k); a naive equal-area split over-fills the middle. e2e: winnability,
negative (lopsided → panel flags + fails), chrome (panel shows; views/result hidden), and an
overlay walkthrough.

## References

- Plan: `thoughts/shared/plans/2026-06-24-tutorial-redesign-pipeline-migration.md`.
- DESIGN-012 — overlay UX spec + tutorial-002 script. GAME-076 — engine (reused).
- GAME-098 — tutorial-003 "Reading the Vote" (the views + election result; trails this).
