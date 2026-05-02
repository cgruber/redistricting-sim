---
id: GAME-058
title: Manual playability test — scenarios 007 and 008 after threshold tightening
area: game, content, QA
status: open
created: 2026-05-02
---

## Summary

Scenarios 007 and 008 had population tolerance tightened from ±10% to ±5%, and
scenario-007's required compactness was raised from 0.40 to 0.50 (PR #186, GAME-031).
The e2e winnability tests confirm valid strategies exist, but a human playthrough is
needed to verify the difficulty feels right — not frustrating, still educational.

## Goals / Acceptance Criteria

- [ ] Play scenario-007 (Reform Map) to completion and confirm a winning map is
      findable within a reasonable number of attempts (target: <15 min)
- [ ] Play scenario-008 (Both Sides Unhappy) to completion and confirm population
      balance at ±5% is achievable without excessive trial-and-error
- [ ] No scenario feels "broken" or impossible for a first-time player
- [ ] If either scenario is too hard: file a sub-ticket to adjust thresholds and
      revert to more lenient values

## References

- GAME-031 — gameplay critique followup (source of threshold changes)
- PR #186 — threshold changes
- `game/scenarios/scenario-007.json` — population_tolerance: 0.05, compactness: 0.50
- `game/scenarios/scenario-008.json` — population_tolerance: 0.05
