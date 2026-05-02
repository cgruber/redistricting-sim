---
id: DESIGN-001
title: Achievement / star-ranking system game ergonomics research
area: design
status: resolved
created: 2026-04-24
github_issue: 182
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

- [x] Research how comparable educational and puzzle games present multi-tier
      success (stars, ranks, medals, etc.).
- [x] Evaluate candidate models:
      - 3-tier stars: 1 star = all required; 2 stars = required + some optional;
        3 stars = all optional
      - N/M stars: 34/45 campaign stars, 1/1 per scenario, etc. (freeform)
      - Per-criterion achievements: no aggregate rank, each optional criterion is
        an independent badge
- [x] Determine whether star count should be fixed (always 3) or variable per
      scenario (driven by optional criteria count).
- [x] Identify what format changes, if any, are needed to support the chosen model
      (e.g., `weight`, `tier`, or `star_value` on `SuccessCriterion`).
- [x] Summarize recommendation with reasoning. No implementation required yet.

## Resolution

Research complete. Recommendation: variable per-criterion stars — 1 base star (all required criteria met) + 1 per optional criterion achieved. No format change needed; `required: boolean` on `SuccessCriterion` already encodes everything. Fixed-3 rejected (arbitrary tier boundary, implies false hierarchy between optional criteria). Campaign aggregate = total stars earned / total available.

## References

- Scenario data format spec: `thoughts/shared/decisions/2026-04-24-scenario-data-format.md`
  (Open Question 10; `SuccessCriterion.required`)
- DIST-001: Steam deployment research (Steam achievements API may inform this)
- Research doc: `thoughts/shared/research/2026-05-02-design-001-achievement-star-system.md`
