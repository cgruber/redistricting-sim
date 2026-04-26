---
id: GAME-009
title: Viewport pan and zoom
area: game, rendering
status: open
created: 2026-04-25
---

## Summary

Add pan and zoom to the map viewport using `d3.zoom()`. Pan and zoom share a
single transform matrix — implementing them together via `d3.zoom` is the
right approach and adds negligible complexity over pan-only. Zoom stays within
the scenario boundary (no state-level view, which is v2).

Boundary stroke widths must remain visually constant regardless of zoom level
(scale inversely with zoom). Base stroke width should be slightly increased
from Sprint 1 values as part of this work.

## Current State

No pan or zoom. The map renders at a fixed viewBox sized to the scenario bounds.
Tutorial-001 (30 precincts) fits the window, but Sprint 3+ scenarios (150–300
precincts) will not.

## Goals / Acceptance Criteria

### Core behaviour
- [ ] `d3.zoom()` applied to the SVG; pan and zoom share the same transform
- [ ] **Scroll wheel** zooms in/out
- [ ] **Keyboard shortcuts**: `=` (zoom in), `-` (zoom out), `0` (reset to
  default scenario view). `+` (Shift+=) aliased to zoom in.
- [ ] **Right-click drag** pans (or two-finger trackpad drag — whichever feels
  most natural in Chromium; document the choice)
- [ ] Zoom-out **floor**: cannot zoom out past the full scenario boundary view
- [ ] Zoom-in **ceiling**: reasonable upper limit (e.g. 3–4 precincts fill the
  screen); prevent zooming in so far the map is a blur of geometry
- [ ] Zoom/pan does not interfere with the left-click paint brush

### Stroke width
- [ ] District boundary lines (`line.boundary`, `line.preview-boundary`) scale
  inversely with zoom so apparent width stays constant
- [ ] Base boundary stroke width increased slightly from the Sprint 1 value
  (exact value: visual judgement call during implementation; suggest 2px base)
- [ ] Outer grid edges and interior district boundary edges remain visually
  distinguishable at all zoom levels

### Keyboard shortcut design decision
- Shortcut keys (`=`/`-`/`0`) are the default, not hardcoded: a future
  Settings screen may allow rebinding. Document them in `index.html` or a
  keyboard-help tooltip.
- Note in implementation: `+` (with Shift) aliased to `=` since users
  instinctively reach for `+` to zoom in.

### State-view note
This ticket intentionally stops at the scenario boundary. The vision's
zoom-out-to-state-view transition is a v2 concern; the zoom floor should be
the full-scenario view, not an arbitrary pixel level, so the transition can
be added later without refactoring.

## Notes

- `d3.zoom()` applies a `transform` attribute to a wrapper `<g>` group inside
  the SVG. All existing groups (borderGroup, hexGroup, previewBorderGroup)
  should be children of this wrapper.
- Stroke width scaling: listen to the `zoom` event; on each transform update,
  set `stroke-width` on boundary lines to `baseWidth / transform.k`.
- Consider whether the zoom/pan wrapper should be between the SVG and the
  existing layer groups, or whether it replaces the viewBox approach.
- CSS transform is an alternative to SVG transform for the wrapper; `d3.zoom`
  works with both. SVG transform is simpler to reason about for stroke scaling.

## References

- `game/web/src/render/mapRenderer.ts` — `initViewBox()`, `renderBoundaries()`,
  `initBrushEvents()`, `initHoverEvents()`
- `game/web/src/model/generator.ts` — `mapBounds()` (used for zoom floor)
- D3 zoom docs: https://d3js.org/d3-zoom
