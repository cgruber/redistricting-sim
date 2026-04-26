---
id: GAME-015
title: Success criteria in scenario format and data model
area: game, content
status: resolved
created: 2026-04-26
---

## Summary

The scenario format currently has no way to express what "winning" looks like. This ticket adds a `criteria` field to the scenario JSON schema and TypeScript types, so each scenario can declare required and optional success conditions (seat counts, population balance thresholds, contiguity requirements, VRA constraints, etc.). This is the prerequisite for the evaluation phase (GAME-017) and for authoring any scenario beyond the tutorial.

## Current State

`game/scenarios/kalanoa_westford.json` has no `criteria` field. `game/web/src/model/scenario.ts` has no `ScenarioCriteria` type. The loader validates structure but has nothing to check about win conditions. The map editor runs freely with no pass/fail concept.

## Goals / Acceptance Criteria

- [ ] `ScenarioCriteria` TypeScript type defined in `scenario.ts` covering at least:
  - [ ] Per-district seat target (party wins district N)
  - [ ] Population balance tolerance (already in `ScenarioRules`)
  - [ ] Contiguity requirement (already in `ScenarioRules` — reuse or reference)
  - [ ] Optional vs. required flag per criterion
- [ ] `Scenario` type gains `criteria: ScenarioCriteria[]` field (required)
- [ ] `loadScenario` validates that `criteria` is present and well-formed
- [ ] Tutorial scenario JSON updated with a minimal criteria array (e.g. "draw any valid map" = population balance only)
- [ ] Existing loader unit tests updated/extended to cover criteria validation

## Test Coverage

- [ ] Unit: `loadScenario` rejects scenario missing `criteria` field
- [ ] Unit: `loadScenario` rejects malformed criterion (missing required fields)
- [ ] Unit: `loadScenario` accepts valid criteria array
- [ ] Unit: N/A for UI — this ticket is data model only; rendering is GAME-017

## References

- Vision §LOOP, §TEST, §SCENARIOS — success criteria drive the evaluation phase
- `game/web/src/model/scenario.ts` — Scenario types
- `game/web/src/model/loader.ts` — loadScenario validator
- `game/web/src/model/loader_test.ts` — existing unit tests
- Depends on: none
- Blocks: GAME-017 (evaluation phase)
