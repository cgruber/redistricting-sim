---
id: GAME-044
title: Unit tests for hex-geometry.ts
area: game, code-quality, testing
status: resolved
created: 2026-04-29
---

## Summary

`hex-geometry.ts` (extracted in GAME-039) contains four pure functions:
`hexToPixel`, `hexCorners`, `mapBounds`, and the `HEX_DIRECTIONS` constant.
These functions drive all precinct layout and neighbor wiring across the
entire game — they are high-value, zero-DOM, and trivially testable in Node.
This ticket adds a unit test file covering their contracts.

## Current State

No tests exist for `hex-geometry.ts`. Coverage comes only indirectly through
Playwright e2e tests that observe rendered map positions.

## Goals / Acceptance Criteria

- [ ] `game/web/src/model/hex-geometry_test.ts` created with TAP-runner tests
- [ ] Tests cover:
  - `hexToPixel(0, 0)` → `{x: 0, y: 0}`
  - `hexToPixel(1, 0)` and `hexToPixel(0, 1)` — pixel offsets match flat-top axial formula
  - `hexCorners`: returns 6 points; all at distance `HEX_SIZE` from center; first corner at `(center.x + 36, center.y)`
  - `hexCorners`: offset center propagates correctly
  - `HEX_DIRECTIONS`: 6 entries; each opposite pair sums to `(0, 0)`
  - `mapBounds`: single-precinct bounding box (width/height = 2 * HEX_SIZE * 1.2 * 2)
  - `mapBounds`: two-precinct bounding box spans both centers
- [ ] Bazel targets `hex_geometry_test_lib` and `hex_geometry_test` added to
  `game/web/src/model/BUILD.bazel`
- [ ] `bazel test //web/src/model:hex_geometry_test` passes

## Test Coverage

All AC items above are the test coverage requirements.

## References

- `game/web/src/model/hex-geometry.ts`
- `game/web/src/model/BUILD.bazel`
- `game/web/src/testing/test_runner.ts`
