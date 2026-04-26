---
id: GAME-017
title: Evaluation phase — Test button, criteria check, pass/fail feedback
area: game, simulation
status: open
created: 2026-04-26
---

## Summary

After the player finishes drawing districts they need to find out if they won. The vision calls for an animated "Test" sequence that evaluates each success criterion and shows which passed and which failed, before transitioning to either a success screen or a feedback-and-retry loop. This ticket implements the evaluation logic and a minimal (non-animated) pass/fail result screen; animation polish is deferred.

## Current State

The map editor runs freely with no evaluation. Election results are computed live via `runElection` in `election.ts`, but they are never compared to success criteria. There is no "Test" button, no pass/fail state, and no result screen.

## Goals / Acceptance Criteria

- [ ] "Submit Map" (or "Test") button added to the editor UI; enabled only when all required validity constraints are met (population balance, contiguity if required, no unassigned precincts)
- [ ] Clicking Submit evaluates each criterion in `scenario.criteria` against current district assignments + election results
- [ ] Result screen shows: each criterion with pass/fail indicator; overall pass or fail; which optional criteria were met
- [ ] Pass: shows success message + "Next Scenario" button (progression gated on GAME-018; for now, just a placeholder)
- [ ] Fail: shows which required criteria failed + "Keep Drawing" button to return to editor
- [ ] Evaluation is pure/deterministic given assignments + scenario; no randomness

## Test Coverage

- [ ] Unit: evaluation function correctly passes/fails each criterion type against known assignments
- [ ] Unit: all-required-pass + some-optional-fail → overall pass
- [ ] Unit: any-required-fail → overall fail
- [ ] e2e: Submit button appears after map is valid
- [ ] e2e: submitting a map that meets all criteria shows pass screen
- [ ] e2e: submitting a map that fails a criterion shows fail screen with that criterion highlighted

## References

- Vision §LOOP, §TEST, §SUCCESS_SCREEN
- `game/web/src/simulation/election.ts` — runElection (already computes district results)
- `game/web/src/simulation/validity.ts` — computeValidityStats (already checks pop balance + contiguity)
- Depends on: GAME-015 (criteria in scenario format)
- Blocks: GAME-018 (progression needs a pass signal)
