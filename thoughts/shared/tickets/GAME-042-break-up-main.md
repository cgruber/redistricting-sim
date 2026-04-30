---
id: GAME-042
title: Break up main.ts god module into testable units
area: game, code-quality
status: open
created: 2026-04-29
---

## Summary

`main.ts` (667 lines) is a single large IIFE containing URL routing, screen management,
WIP lifecycle, keyboard shortcuts, button handlers, result rendering, debug mode, and the
store subscription loop. All functions are lexically scoped inside the async IIFE, making
them untestable in isolation. This ticket decomposes the file into focused, importable
modules.

## Current State

One top-level async IIFE. No functions are exported. Nothing in `main.ts` can be unit
tested without launching the full browser environment.

## Goals / Acceptance Criteria

- [ ] `ui/scenarioSelect.ts` — `renderScenarioCards`, `showWipWarning`, `showScenarioSelect`
  (~95 lines of scenario-select logic)
- [ ] `ui/resultScreen.ts` — `showResultScreen` and result HTML rendering (~80 lines)
- [ ] `ui/introFlow.ts` — `startScenarioIntro`, `showEditor` intro-slide logic (~50 lines)
- [ ] `main.ts` reduced to a thin coordinator: routing, screen dispatch, store subscription,
  keyboard wiring
- [ ] Each extracted module is a `ts_library` target in BUILD.bazel
- [ ] Extracted pure logic functions have unit tests where feasible
- [ ] `bazel build //game/web/...` and full e2e suite pass with no behavior change

## Test Coverage

- [ ] At minimum: `showLoadError`, error-path helpers in extracted modules get unit tests
- [ ] E2e suite continues to pass as the primary behavioral validation

## Notes

This is the highest-effort ticket in the quality backlog. Do not undertake alongside other
simultaneous structural changes. Recommend a dedicated PR with thorough e2e validation before
merge.

## References

- `game/web/src/main.ts`
- `game/web/src/BUILD.bazel` (or wherever `main.ts` target lives)
- GAME-034 (error panel dedup — complete before this ticket to reduce noise)
