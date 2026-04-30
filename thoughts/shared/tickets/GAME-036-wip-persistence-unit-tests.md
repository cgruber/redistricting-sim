---
id: GAME-036
title: Unit tests for WIP persistence functions in progress.ts
area: game, testing
status: open
created: 2026-04-29
---

## Summary

`model/progress.ts` has `saveWip`, `loadWip`, and `clearWip` functions that manage in-progress
district assignments in `localStorage`. The completion-tracking functions in the same file
(`markCompleted`, `isCompleted`, `serialize`, `deserialize`) are already tested in
`progress_test.ts`. The WIP functions are not.

## Current State

`progress_test.ts` covers the `Progress` completion model only. The WIP persistence surface
(`saveWip`/`loadWip`/`clearWip`) has no test coverage despite being a non-trivial localStorage
contract relied upon by the game's save/resume flow.

## Goals / Acceptance Criteria

- [ ] `saveWip` + `loadWip` round-trip: saved assignments can be loaded back unchanged
- [ ] `loadWip` returns `null` when nothing has been saved for that scenario
- [ ] `clearWip` removes a previously saved WIP; subsequent `loadWip` returns `null`
- [ ] `loadWip` with a corrupt/malformed localStorage value returns `null` gracefully
- [ ] All new tests added to existing `progress_test.ts`; `bazel test //game/web/src/model:progress_test` passes

## Test Coverage

This ticket IS the test coverage work.

## References

- `game/web/src/model/progress.ts`
- `game/web/src/model/progress_test.ts`
- `game/web/src/model/BUILD.bazel`
