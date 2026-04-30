---
id: GAME-045
title: Unit tests for gameStore.ts
area: game, code-quality, testing
status: resolved
created: 2026-04-29
---

## Summary

`gameStore.ts` is the central state machine for the game: it manages district
assignments, drives election re-simulation on every paint, and maintains
undo/redo via zundo's temporal middleware. Both `zustand/vanilla` and `zundo`
work in Node.js without a DOM, so these behaviors are testable as pure unit
tests. This ticket adds a unit test file using a minimal in-memory scenario
fixture.

## Current State

No unit tests exist for `gameStore.ts`. Coverage is entirely through Playwright
e2e tests, which test rendered outcomes but cannot isolate store behavior.

## Goals / Acceptance Criteria

- [ ] `game/web/src/store/gameStore_test.ts` created with TAP-runner tests
- [ ] Tests cover:
  - Initial state: `activeDistrict = 1`; assignments match scenario
    `initial_district_id` values; `simulationResult` is not null
  - `setActiveDistrict`: changes `activeDistrict`
  - `paintPrecinct`: updates assignment for the target precinct and sets
    `simulationResult`; is a no-op if precinct already in target district
  - `paintStroke`: assigns a batch of precincts atomically; is a no-op if all
    precincts already in target district
  - `resetToInitial`: restores original assignments regardless of changes made
  - `restoreAssignments`: sets the provided assignment map and active district
  - `undo`: reverting a `paintPrecinct` restores the previous assignment
- [ ] `game/web/src/store/BUILD.bazel` created with `gameStore_lib` and
  `gameStore_test` Bazel targets
- [ ] `game/web/src/store/tsconfig.json` created (self-contained, mirrors
  `src/simulation/tsconfig.json`)
- [ ] `//web/src/store:gameStore_lib` added as explicit dep to both
  `app_typecheck_lib` and `app` in `game/web/BUILD.bazel`
- [ ] `bazel test //web/src/store:gameStore_test` passes

## Test Coverage

All AC items above are the test coverage requirements. DOM and D3 internals
are explicitly out of scope.

## References

- `game/web/src/store/gameStore.ts`
- `game/web/src/simulation/BUILD.bazel` (tsconfig + BUILD pattern to follow)
- `game/web/src/model/adapter_test.ts` (scenario fixture helper pattern)
- `game/web/BUILD.bazel` (explicit dep wiring after package creation)
