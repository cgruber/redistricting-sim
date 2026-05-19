---
id: GAME-079
title: Scenario-002 playability tuning — tighten trivially-easy first educational scenario
area: game, content
status: open
created: 2026-05-18
---

## Summary

Scenario-002 (the first scenario in the Educational campaign) can be solved with very minimal
map alteration, undermining the educational goal of requiring players to engage meaningfully
with the redistricting criteria it introduces. Investigate why and tighten it — via threshold
adjustment, starting map modification, or addition of a required criterion — so the scenario
requires genuine deliberate effort.

## Current State

Players can satisfy all required criteria in scenario-002 with only a handful of precinct swaps
from the initial state. The scenario does not require engaging with the redistricting mechanics
it is meant to teach.

## Goals / Acceptance Criteria

- [ ] Root cause identified: which criteria are trivially satisfied by the starting map?
- [ ] Solution designed: threshold tightening, starting map modification, or additional criterion
- [ ] Updated scenario requires a meaningful number of deliberate moves (target: 10+ swaps)
- [ ] Existing e2e tests for scenario-002 updated to match new thresholds / layout
- [ ] Winnability: at least one known solution path documented; e2e solve test still passes
- [ ] Manual playthrough confirms the scenario feels like it requires genuine engagement

## Test Coverage

- [ ] e2e: submitting the starting map unchanged fails at least one required criterion
- [ ] e2e: known solution path still passes all required criteria
- [ ] Manual: full playthrough requires reasoning about the goal, not just random swaps

## References

- `game/public/scenarios/scenario-002.json` — current scenario definition
- `game/web/e2e/scenarios.spec.ts` — existing scenario-002 e2e tests
- GAME-031 — prior threshold tuning (what was already tightened; don't double-tighten blindly)
- GAME-058 — manual playability test (related; can combine effort)
