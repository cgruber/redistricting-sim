---
id: GAME-037
title: Unit tests for adapter.ts (scenarioToSpike)
area: game, testing
status: open
created: 2026-04-29
---

## Summary

`model/adapter.ts` contains `scenarioToSpike()` — the bridge that converts scenario-format
data into the spike internal type system used by the renderer and simulation. This function
performs party-share weighting, neighbor array construction, and district assignment passthrough.
It has no unit tests.

## Current State

No `adapter_test.ts` exists. The adapter is exercised only via e2e, making its internal
transformations (e.g. party key ordering, neighbor ID lists) invisible to the unit test layer.

## Goals / Acceptance Criteria

- [ ] `game/web/src/model/adapter_test.ts` exists using the established TAP runner pattern
- [ ] Test: correct number of precincts produced for a given scenario fixture
- [ ] Test: party vote-share values passed through correctly for a precinct with known partisan data
- [ ] Test: neighbor lists populated (precinct with 2 neighbors → 2 entries in `neighbors`)
- [ ] Test: all precincts assigned to their initial district from scenario assignments map
- [ ] `js_test` target added to `game/web/src/model/BUILD.bazel`
- [ ] `bazel test //game/web/src/model:adapter_test` passes

## Test Coverage

This ticket IS the test coverage work. Construct minimal scenario fixtures inline in the
test file; do not load JSON from disk.

## References

- `game/web/src/model/adapter.ts`
- `game/web/src/model/BUILD.bazel`
- Existing pattern: `loader_test.ts`, `progress_test.ts`
