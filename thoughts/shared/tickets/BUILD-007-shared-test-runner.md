---
id: BUILD-007
title: Extract shared TAP test runner module
area: build, testing
status: open
created: 2026-04-29
---

## Summary

The TAP-style test runner boilerplate (`let testCount`, `function test()`, `function
assertEqual()`, `function assertThrows()`, etc.) is copy-pasted into `loader_test.ts`,
`evaluate_test.ts`, `validity_test.ts`, and `progress_test.ts` with minor variations.
Each test file ships its own copy, making any fix or enhancement a four-file edit. Extract
a shared `test_runner.ts` module that all unit test files import.

## Current State

~25 lines of identical test infrastructure in each of the four (and counting) `*_test.ts`
files. `progress_test.ts` uses a slightly different variant with `passed`/`failed`/`total`
counters; reconcile into one consistent API.

## Goals / Acceptance Criteria

- [ ] `game/web/src/test_runner.ts` (or `src/testing/test_runner.ts`) exports: `test()`,
  `assertEqual()`, `assertThrows()`, `summarize()` (prints pass/fail/total summary)
- [ ] `ts_library` (or appropriate Bazel target) for `test_runner.ts` in its BUILD.bazel
- [ ] All four existing `*_test.ts` files updated to import from the shared module and remove
  their inline boilerplate
- [ ] New test files added in GAME-035 (election), GAME-036 (WIP), GAME-037 (adapter) also
  use the shared module from the start
- [ ] `bazel test //game/web/src/...` still passes in full

## Test Coverage

The shared runner is test infrastructure; its correctness is validated by the passing of
all dependent test targets.

## References

- `game/web/src/model/loader_test.ts` (inline boilerplate)
- `game/web/src/simulation/evaluate_test.ts` (inline boilerplate)
- `game/web/src/simulation/validity_test.ts` (inline boilerplate)
- `game/web/src/model/progress_test.ts` (slightly different variant)
- GAME-035, GAME-036, GAME-037 (new tests that should use the shared runner)
