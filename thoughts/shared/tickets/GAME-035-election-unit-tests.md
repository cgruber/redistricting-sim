---
id: GAME-035
title: Unit tests for election.ts
area: game, testing
status: resolved
created: 2026-04-29
---

## Summary

`simulation/election.ts` contains `runElection()` and `simulateDistrict()` — the core
election simulation engine. Neither function has any unit tests. They are exercised only
indirectly via e2e tests. As a pure domain module with no DOM dependency, it is a strong
unit-test candidate.

## Current State

No `election_test.ts` file exists. `runElection` and `simulateDistrict` are untested in
isolation; breakage is only catchable at the e2e layer.

## Goals / Acceptance Criteria

- [ ] `game/web/src/simulation/election_test.ts` exists using the established TAP runner pattern
- [ ] `simulateDistrict`: tests for a district with a clear R majority, D majority, and a
  near-tie; assert winner and margin output
- [ ] `runElection`: tests covering all districts assigned, some unassigned, and empty
  assignment map; assert seat counts and per-district results
- [ ] `js_test` target added to `game/web/src/simulation/BUILD.bazel`
- [ ] `bazel test //game/web/src/simulation:election_test` passes

## Test Coverage

This ticket IS the test coverage work. No other tests needed beyond the unit suite above.

## References

- `game/web/src/simulation/election.ts`
- `game/web/src/simulation/BUILD.bazel`
- Existing pattern: `evaluate_test.ts`, `validity_test.ts`
