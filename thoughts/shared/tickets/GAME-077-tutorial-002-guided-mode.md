---
id: GAME-077
title: Tutorial-002 "A Legal Map" — contiguity + balanced population (guided)
area: game, UX, tutorial, content
status: open
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

- [ ] `tutorial-002.spec.yaml` authored; `tutorial-002.json` generated via the pipeline.
- [ ] Enforces balance + contiguity (criterion + `contiguity: required`); validity panel shows.
- [ ] `guided: true` + `hide_election_results: true` + `hide_view_toolbar: true`.
- [ ] Guided script per DESIGN-012; reuses GAME-076 engine (no fork).
- [ ] Skip / persist consistent with T1 (`tutorial-tutorial-002-complete`).
- [ ] e2e: winnable by drawing balanced + contiguous districts; an unbalanced/disconnected
      attempt fails and the validity panel flags it; views/result panels absent.

## References

- Plan: `thoughts/shared/plans/2026-06-24-tutorial-redesign-pipeline-migration.md`.
- DESIGN-012 — overlay UX spec + tutorial-002 script. GAME-076 — engine (reused).
- GAME-098 — tutorial-003 "Reading the Vote" (the views + election result; trails this).
