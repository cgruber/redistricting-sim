---
id: GAME-039
title: Extract hex geometry utilities from generator.ts
area: game, code-quality
status: resolved
created: 2026-04-29
---

## Summary

`model/generator.ts` (267 lines) contains two distinct concerns: (1) a procedural precinct
generator (`generatePrecincts`, `makePrng`, `gaussianContribution`, `makePartisanField`,
`Epicenter`) that is dead code in the scenario-driven game path, and (2) pure hex geometry
utilities (`hexToPixel`, `hexCorners`, `mapBounds`, `HEX_DIRECTIONS`) that are actively
imported by `adapter.ts` and `mapRenderer.ts`. Extract the geometry utilities to a leaner
`model/hex-geometry.ts` so the dead generator code can be safely isolated.

## Current State

Production code imports `hexToPixel`, `hexCorners`, `mapBounds`, `HEX_DIRECTIONS` from
`generator.ts`. The generator itself (`generatePrecincts` and friends) is not called in
any scenario-path code — it was the original spike procedural approach.

## Goals / Acceptance Criteria

- [ ] New `game/web/src/model/hex-geometry.ts` exports `hexToPixel`, `hexCorners`,
  `mapBounds`, `HEX_DIRECTIONS` (and `HexCoord` type if needed)
- [ ] `ts_library` target for `hex-geometry.ts` in `game/web/src/model/BUILD.bazel`
- [ ] All imports in `adapter.ts` and `mapRenderer.ts` updated to import from `hex-geometry.ts`
- [ ] `generator.ts` updated to import from `hex-geometry.ts` (so it still compiles if kept)
  or clearly marked as spike-only with a comment; it need not be deleted in this ticket
- [ ] `bazel build //game/web/...` and full test suite pass

## Test Coverage

No new tests required — hex geometry functions are pure math; their correctness is already
implicitly validated by rendering tests and e2e suite.

## References

- `game/web/src/model/generator.ts`
- `game/web/src/model/adapter.ts` (imports hex utils)
- `game/web/src/render/mapRenderer.ts` (imports hex utils)
- `game/web/src/model/BUILD.bazel`
