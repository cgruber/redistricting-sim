---
id: DESIGN-004
title: Move legend to horizontal strip above map
area: design, UX
status: open
created: 2026-04-26
---

## Summary

The district color legend currently sits at the bottom of the right sidebar, stacked vertically. As the number of districts grows it consumes significant sidebar space and competes with the validity panel and precinct info. Moving it to a horizontal strip above (or overlaid on) the map frees sidebar space for data panels and keeps the legend adjacent to the map it annotates.

## Current State

Legend is rendered in `#legend-container` inside `#sidebar` as a vertical list of color swatches + labels. This works for 2–3 districts but becomes cramped as district count grows.

## Goals / Acceptance Criteria

- [ ] Legend is rendered as a horizontal row of swatch+label pairs, positioned above the map or as a floating overlay at the top of `#map-container`
- [ ] Legend does not overlap the map controls in the header
- [ ] Legend remains readable at all scenario district counts (up to ~8 districts)
- [ ] Sidebar no longer contains the legend section
- [ ] Layout works at typical browser viewport widths (1280px+)

## Test Coverage

- [ ] e2e: legend element is present in the map container (not sidebar) after load
- [ ] e2e: all district color swatches are visible in the legend
- [ ] Unit: N/A — layout is DOM/CSS only

## References

- Raised during Sprint 2 demo review (2026-04-26)
- `game/web/index.html` — `#legend-container`, `#sidebar`, `#map-container`
- `game/web/src/main.ts` — legend rendering logic
