---
id: GAME-034
title: Deduplicate inline error panel HTML in main.ts
area: game, code-quality
status: resolved
created: 2026-04-29
---

## Summary

Two nearly identical `insertAdjacentHTML` error-panel blocks exist in `main.ts` (lines ~277–287
for fetch errors, ~295–304 for validation errors). The only difference is the detail text.
Extract them into a single `showLoadError(scenarioId: string, detail: string)` function.

## Current State

~60 lines of duplicated error HTML template; any styling or copy change must be made twice
with no guarantee of consistency.

## Goals / Acceptance Criteria

- [ ] Single `showLoadError(scenarioId, detail)` function in `main.ts`
- [ ] Both call-sites (fetch failure, validation failure) replaced with calls to the new function
- [ ] Both error paths still display a user-visible error screen with scenario ID and detail
- [ ] `bazel test //game/web/e2e:e2e_test` suite still passes

## Test Coverage

- Existing e2e tests exercise the error screen via load-failure scenarios; re-run confirms no
  regression.
- No new unit tests needed — behavior is covered by existing e2e.

## References

- `game/web/src/main.ts` lines ~277–304
- GAME-032 (load error screen feature that introduced these blocks)
