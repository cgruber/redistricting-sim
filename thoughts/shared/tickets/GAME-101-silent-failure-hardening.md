---
id: GAME-101
title: Silent-failure hardening — fail loud on test, loader, criterion, and WASM failure paths
area: game, code-quality, robustness
status: open
created: 2026-06-27
---

## Summary

A cluster of small, high-leverage fixes that each convert a **silent** failure into a
**loud** one. Sourced from the 2026-06-27 codebase quality review (top-of-list "fix-now"
batch). Comingled deliberately: all four are one-liner-class hardening changes on
correctness-critical paths and ship as one focused PR.

## Current State

- **Test harness exits green despite failures.** `test()` (`test_runner.ts:16-26`) catches
  each assertion, increments `_failed`, and does **not** rethrow; the process only exits
  nonzero when `summarize()` throws (`107-115`). A test file that omits the trailing
  `summarize()` runs, prints `not ok`, and exits 0 — bazel reports PASS. There is no
  `process.on('exit')` backstop.
- **`requireNumber` accepts NaN/Infinity/negative** (`runtime-types.ts:28-31`, typeof-only).
  A `NaN` share defeats the `Math.abs(sum - 1) > EPSILON` invariants (`loader.ts:599,617,
  1223,1255`) — `NaN > EPSILON` is `false`, so the malformed-demographics check passes — and
  a corrupt `total_population` makes `pluralityWinner` (`election.ts:26-32`) return a
  plausible-but-wrong `'R'` instead of erroring.
- **`evaluateCriteria` has no exhaustiveness guard** (`evaluate.ts:187-326`): an
  assignment-style `switch (c.type)` with no `default`/never-assertion. Adding a 10th
  `Criterion` variant compiles cleanly and silently yields `passed=false`; neither
  `noImplicitReturns` nor `noFallthroughCasesInSwitch` can catch it.
- **WASM init has no `.catch()`** (`index.html:291-299`) and `bundle.js` injection is gated
  entirely behind WASM success — yet nothing in `src` calls `wasm_bindgen`. A `.wasm`
  404/compile failure yields a permanently blank page with no error.

## Goals / Acceptance Criteria

- [ ] `test_runner.ts` registers `process.on('exit', () => { if (_failed > 0) process.exitCode = 1; })` so a forgotten `summarize()` still fails the run.
- [ ] `requireNumber` rejects non-finite values (`!Number.isFinite(v)` → throw). Add range checks where semantics demand: `total_population >= 0`; `population_share`/`turnout_rate`/`vote_shares` in `0..1`.
- [ ] `evaluateCriteria` has a `default` arm with `const _x: never = c; throw …`; introduce a shared `assertNever(x: never): never` helper.
- [ ] WASM init gets a `.catch()` that surfaces a visible "Failed to start" message (matching `showLoadError`), AND `bundle.js` loads regardless of WASM outcome — OR, since the kernel is unused, the WASM `<script>` tags and the `//game/rust` dep are removed entirely (decide during implementation; prefer removal if confirmed unused).

## Test Coverage

- [ ] `loader_test.ts`: add `assertThrows` cases for `total_population` = `NaN`/`Infinity`/negative, a `population_share` making the sum `NaN`, and a `vote_share` of `Infinity` — all fail today (no throw).
- [ ] `evaluate_test.ts` (or a type-level test): adding a `Criterion` variant without a case is a compile error (documented; the never-assertion enforces it).
- [ ] A deliberately-failing throwaway test confirms the harness now exits nonzero without `summarize()` (manual/CI verification; do not commit the failing test).

## References

- Review: `thoughts/shared/research/2026-06-27-codebase-quality-review.md` (top-10 #1–#4)
- `game/web/src/testing/test_runner.ts`, `game/web/src/model/runtime-types.ts`,
  `game/web/src/simulation/evaluate.ts`, `game/web/index.html`
- Related: GAME-102 (loader de-dup, shares `requireNumber`), GAME-109 (test backstops)
