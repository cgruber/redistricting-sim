---
id: GAME-040
title: Name magic numbers in mapRenderer.ts
area: game, code-quality
status: open
created: 2026-04-29
---

## Summary

`render/mapRenderer.ts` contains several undocumented inline numeric literals whose purpose
is not self-evident from context. Name them as module-level constants so future rendering
work does not require reconstructing their meaning from surrounding code.

## Current State

Inline magic numbers in `mapRenderer.ts`:
- `0.55` and `0.30` — lightness coefficients in population-density color calculation
  (appears twice, identically, at lines ~573 and ~594)
- `1.3` — zoom-step multiplier (lines ~313, ~315)
- `0.7` — county border opacity (~line 237)
- `0.6` — boundary opacity (~line 371)
- `0.85` — preview border opacity (~line 413)
- `0.95` — hover opacity (~line 447)
- `800`, `600` — fallback SVG dimensions (~lines 255–256)

## Goals / Acceptance Criteria

- [ ] Each magic number above replaced with a named `const` at the top of `mapRenderer.ts`
  (or grouped in a `RENDER_CONSTANTS` block)
- [ ] The duplicated lightness calculation (`0.55 - normPop * 0.30`) is extracted to a
  named helper or at minimum uses the named constants
- [ ] No behavior change; `bazel build //game/web/...` and e2e suite pass

## Test Coverage

No new tests needed — this is a naming-only refactor; behavior is unchanged.

## References

- `game/web/src/render/mapRenderer.ts` lines ~237, 255–256, 313, 315, 371, 413, 447, 573, 594
