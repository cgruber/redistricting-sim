---
id: GAME-031
title: Address gameplay critique feedback from external review
area: game, content, balance
status: resolved
created: 2026-04-27
github_issue: 185
---

## Summary

An external agent (goose) performed a gameplay critique of the WIP game and
produced a research document with findings on scenario difficulty, evaluation
balance, and design feedback. This ticket tracks reviewing and acting on
that feedback.

## Resolution

Critique reviewed and dispositioned (2026-05-02). Overall rating: 8.5/10. Findings:

**Implemented (this ticket):**
- Population tolerance tightened: scenarios 007 and 008 reduced from ±10% → ±5%.
  These are the reform/neutral-rules scenarios where population balance is a central
  pedagogical goal. Partisan-tactics scenarios (002–006, 009) left at ±10% — the
  winning strategies for those scenarios are constrained by geography and cannot
  achieve ±5% without losing the tactical clarity they're designed to teach.
- Scenario-007 required compactness threshold raised: 0.40 → 0.50. Reform Map is
  explicitly about compactness; a higher bar makes the lesson more meaningful.

**Deferred to sub-ticket:**
- Per-session randomization (population/lean ±5% seeded per session): filed as
  GAME-057. Requires careful design to keep e2e tests deterministic.

**Rejected for now:**
- Optional criteria expansions (Minimal Strokes, Extreme Gerry, County-Respectful):
  DESIGN-001 now settled on variable per-criterion stars; expanding optional criteria
  is a content authoring task. No sub-ticket needed — authors can add when writing
  future scenarios.
- Size climax (s009 150+ precincts): s009 is the fun educational finale; scaling it
  up risks breaking the light "Cats vs Dogs" tone. Deferred to post-v1 content work.
- Dynamic hints after failed submits: low impact vs. effort for v1. Deferred.
- Randomization of events, multi-election overlays (v2 features): deferred.

## Goals / Acceptance Criteria

- [x] Review the gameplay critique research document
- [x] Categorize findings: accept / reject / defer (with rationale)
- [x] For accepted findings: implement changes or file sub-tickets
- [x] Document disposition in this ticket

## References

- `thoughts/shared/research/2026-04-27-gameplay-critique.md`
