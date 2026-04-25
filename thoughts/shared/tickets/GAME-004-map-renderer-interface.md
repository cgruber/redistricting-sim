---
id: GAME-004
title: Extract MapRenderer interface from spike renderer
area: game, rendering
status: resolved
created: 2026-04-25
github_issue: 32
---

## Summary

The map geography ADR requires a `MapRenderer` interface from v1, with
`SvgMapRenderer` as the first implementation. The spike has a single concrete
`MapRenderer` class. Extract the interface so game logic never imports a concrete
renderer, enabling the Canvas+SVG hybrid swap later without refactoring callers.

## Current State

`game/web/src/render/mapRenderer.ts` contains a concrete `MapRenderer` class.
`game/web/src/main.ts` instantiates it directly. No interface exists.

## Goals / Acceptance Criteria

- [x] `MapRenderer` defined as a TypeScript interface in
  `game/web/src/render/mapRenderer.ts` (or a new `types.ts` in that dir)
  - `render(): void`
  - `setViewMode(mode: ViewMode): void`
  - `setCountyBordersVisible(visible: boolean): void`
    (county border overlay is an independent toggleable layer per the map geography ADR;
    interface must include it from v1 even if the toggle is a no-op in SvgMapRenderer
    until county_id data is present)
  - Anything else currently called on the concrete class from `main.ts`
- [x] Rename concrete class to `SvgMapRenderer implements MapRenderer`
- [x] `main.ts` typed against `MapRenderer` (the interface), not `SvgMapRenderer`
  - Construction site (`new SvgMapRenderer(...)`) is the one allowed concrete reference
- [x] `ViewMode` type exported (`"districts" | "lean"` from spike, expandable later)
- [x] All existing spike functionality continues to work (paint, undo/redo, view toggle,
  district buttons, results panel, WASM diagnostic)
- [x] `bazel build //game/web/...` and `bazel test //game/web/...` pass (if tests exist)

## References

- ADR: `thoughts/shared/decisions/2026-04-24-map-geography-and-rendering-architecture.md`
  §Decision 6 (renderer-agnostic model, interface boundary from v1)
- Spike renderer: `game/web/src/render/mapRenderer.ts`
- Spike entry: `game/web/src/main.ts`
