---
id: GAME-041
title: Split loader.ts into focused modules
area: game, code-quality
status: resolved
created: 2026-04-29
github_issue: 255
---

## Summary

`model/loader.ts` (894 lines) performs three distinct roles: (1) runtime type-checking
primitives (`requireString`, `requireNumber`, etc.), (2) a suite of sub-parsers for
individual JSON shapes, and (3) 12 validation invariants packed into a single
~400-line function. Split into focused modules to improve navigability and testability.

## Current State

`loadScenario()` runs from line ~506 to 894. The primitive helpers (lines ~44–87) have no
domain knowledge and are a natural standalone library. The invariant block is large enough
to warrant its own `validateScenario()` private function or module.

## Goals / Acceptance Criteria

- [x] `model/runtime-types.ts` exported module with `requireString`, `requireNumber`,
  `requireBoolean`, `requireArray`, `requireObject`, and friends
- [x] `model/loader.ts` imports from `runtime-types.ts`; reduced by ~50 lines
- [x] `validateScenarioInvariants()` extracted as a named internal function in `loader.ts`;
  takes parsed data structures (not raw JSON); `cartesianProduct` moved to module level
- [x] All existing `loader_test.ts` tests continue to pass unchanged
- [x] No behavior change; purely structural

## Test Coverage

No new tests needed — full loader test suite already covers the code being reorganized.
`runtime-types.ts` primitives are implicitly tested via all `loader_test.ts` cases.

## References

- `game/web/src/model/loader.ts`
- `game/web/src/model/loader_test.ts`
- `game/web/src/model/BUILD.bazel`
- GAME-084 (map generation pipeline) — depends on this ticket; the named `validateScenario()` extraction is a prerequisite for GAME-084's load/validate behavioral split
