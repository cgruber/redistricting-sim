---
id: DESIGN-001
title: Achievement / star-ranking system game ergonomics research
area: design
status: open
created: 2026-04-24
---

## Summary

The scenario data format supports `required: false` on `SuccessCriterion`, which
architecturally enables optional objectives. Before the format is extended to support
a formal star/achievement ranking system, game ergonomics research is needed to
determine the right UX model.

## Current State

The spec supports optional criteria today. No star-ranking UX is defined. The
scenario format has no ranking shape, weighting, or display contract for optional
criteria beyond "they exist."

## Goals / Acceptance Criteria

- [ ] Research how comparable educational and puzzle games present multi-tier
      success (stars, ranks, medals, etc.).
- [ ] Evaluate candidate models:
      - 3-tier stars: 1 star = all required; 2 stars = required + some optional;
        3 stars = all optional
      - N/M stars: 34/45 campaign stars, 1/1 per scenario, etc. (freeform)
      - Per-criterion achievements: no aggregate rank, each optional criterion is
        an independent badge
- [ ] Determine whether star count should be fixed (always 3) or variable per
      scenario (driven by optional criteria count).
- [ ] Identify what format changes, if any, are needed to support the chosen model
      (e.g., `weight`, `tier`, or `star_value` on `SuccessCriterion`).
- [ ] Summarize recommendation with reasoning. No implementation required yet.

## References

- Scenario data format spec: `thoughts/shared/decisions/2026-04-24-scenario-data-format.md`
  (Open Question 10; `SuccessCriterion.required`)
- DIST-001: Steam deployment research (Steam achievements API may inform this)
