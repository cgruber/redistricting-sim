---
id: DESIGN-006
title: Zoom-adaptive dot density scaling
area: design, rendering, performance
status: open
created: 2026-04-27
---

## Summary

Refine the dot density overlay (DESIGN-005) so that dot count scales with the current
zoom level: fewer dots when zoomed out (each dot represents more people), more dots
when zoomed in (finer-grained population texture). Proportions are preserved across
zoom levels — the relative visual density between precincts stays constant.

This is a refinement on top of DESIGN-005 and can be deferred post-v1 if DESIGN-005's
static dot count reads well enough at the game's default zoom level.

## Current State

Depends on DESIGN-005 (population dot overlay). DESIGN-005 uses a fixed MAX_DOTS=6
regardless of zoom level.

## Goals / Acceptance Criteria

- [ ] Dot count per precinct scales continuously with d3 zoom transform scale (k)
- [ ] At minimum zoom (full map view): 0–2 dots per precinct (sparse, readable at small size)
- [ ] At maximum zoom (single precinct fills most of viewport): 10–20 dots per precinct
- [ ] Proportions between precincts preserved at all zoom levels
- [ ] Scaling uses a smooth function (e.g. log or sqrt of k) rather than stepped tiers
- [ ] Re-render on zoom events does not cause perceptible jank (debounced or RAF-gated)
- [ ] Person glyph icons (SVG silhouette) replace dot circles when per-precinct pixel
  area exceeds a threshold (e.g. hex radius > 20px in screen space); below threshold, dots

## Notes

- This ticket requires research into performance characteristics of re-rendering
  dot overlays on zoom events for 300+ precinct scenarios.
- The person glyph threshold is a UX/rendering research question — recommend a
  SPIKE or research doc before implementing the glyph path.
- Depends on: DESIGN-005

## References

- DESIGN-005 — base dot density overlay (prerequisite)
- `game/web/src/render/mapRenderer.ts` — zoom handling
