---
id: GAME-109
title: Test infrastructure backstops + missing unit coverage
area: game, testing, ci
status: open
created: 2026-06-27
---

## Summary

Coverage can silently erode and several pure, branchy functions are untested. Adds structural
backstops so gaps fail CI, plus the missing unit tests. From the 2026-06-27 quality review
(Theme 6). (The harness fail-loud fix lives in GAME-101.)

## Current State

- **No backstop catches an unwired `_test.ts`.** Each unit test is a hand-authored
  `ts_project` + `js_test` pair; there's no meta-test enumerating `src/**/*_test.ts` against
  `js_test` targets (the existing `build_test` targets are typecheck-only). A new colocated
  test the author forgets to wire compiles into nothing and never runs — `bazel test //...`
  stays green.
- **Integration test iterates a hardcoded table.** `loader_integration_test.ts:43-90` loops a
  hand-written 12-scenario `SCENARIOS` array, but the bazel data dep globs `*.json`. Under
  the "generator emits ALL scenarios" philosophy, the first new scenario loads in-app but is
  silently skipped by the only content-validation test.
- **Untested pure branches:** `safe_seats`/`competitive_seats` criterion boundaries
  (`evaluate.ts:229-246`; `>=`/threshold edges and margin-rounding); `getCriterionIcon`
  (`criterion-icons.ts:102-111`, no icon/type exhaustiveness guard).
- **Vestigial test dep:** `adapter_test` lists `generator_lib` as a data dep it never imports
  (`model/BUILD.bazel:178`); `generator.ts` has no importers in `src` (dead).

## Goals / Acceptance Criteria

- [ ] Add a meta-test that globs `src/**/*_test.ts` and asserts each has a corresponding `js_test` target; fails CI on an unwired test file. (Keep the explicit per-target convention — this is a backstop, not a macro that replaces it.)
- [ ] Drive `loader_integration_test.ts` from the filesystem: resolve the scenarios dir from `RUNFILES_DIR` (logic already at `18-35`), glob `*.json` (exclude `*.overlay.json`), assert each loads without throwing; keep precinct/district-count assertions for the known set via a lookup map.
- [ ] Add `evaluate_test.ts` cases for `safe_seats` (margin just above / exactly `==` / just below threshold; `safeCount < min_count`) and a `competitive_seats` boundary case.
- [ ] Add `criterion-icons_test.ts` (+ target): correct icon per `Criterion['type']`, prefix resolution for `validity:*`, and an exhaustiveness check that every type in `scenario.ts` has an `ICONS` entry.
- [ ] Drop `:generator_lib` from the `adapter_test` data list; either delete `generator.ts`/`generator_lib` or mark it `@deprecated` dead code.

## Test Coverage

This ticket **is** test coverage; AC above are the tests. All new targets green under `bazel test //game/...`.

## References

- Review: `thoughts/shared/research/2026-06-27-codebase-quality-review.md` (Theme 6)
- `game/web/src/model/loader_integration_test.ts`, `game/web/src/simulation/evaluate.ts`, `game/web/src/criterion-icons.ts`, `game/web/src/model/BUILD.bazel`, `game/web/src/model/generator.ts`
- Related: GAME-101 (harness fail-loud), GAME-046 (panels.ts tests)
