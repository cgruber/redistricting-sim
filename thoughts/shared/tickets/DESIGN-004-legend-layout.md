---
id: DESIGN-004
title: Move legend to floating bar at bottom of map
area: design, UX
status: open
created: 2026-04-26
---

## Summary

The district color legend currently sits at the bottom of the right sidebar, stacked
vertically. As the number of districts grows it consumes significant sidebar space and
competes with the validity panel and precinct info. Moving it to a floating horizontal
bar at the bottom of the map canvas frees sidebar space for data panels and keeps the
legend adjacent to the map it annotates.

The legend is purely a color-context annotation for the current view/filter. View
mode toggles and demographic dimension selectors are separate controls and are not
part of this ticket (see DESIGN-007 for the dimension selector placement question).

## Current State

Legend is rendered in `#legend-container` inside `#sidebar` as a vertical list of
color swatches + labels. This works for 2–3 districts but becomes cramped as district
count grows.

## Goals / Acceptance Criteria

- [ ] Legend is rendered as a floating overlay positioned at the **bottom** of
  `#map-container` (overlapping the bottom edge of the map canvas, not below it)
- [ ] Legend position (floating overlay vs. fixed strip) is togglable via a debug
  button; the toggle state is not persisted
- [ ] Legend label format: `[Region name] — D[N]` (e.g. "Clearwater — D1"), where
  region name comes from `scenario.region` or equivalent scenario field
- [ ] Label slot accommodates future variable-length names without breaking layout
- [ ] Legend does not overlap the map controls in the header
- [ ] Legend remains readable at all scenario district counts (up to ~8 districts)
- [ ] Sidebar no longer contains the legend section
- [ ] Layout works at typical browser viewport widths (1280px+)

## Future / Out of Scope

- County names rendered along the inside of county borders (like a real map) — deferred
- View mode toggle placement — already exists in header; no changes in this ticket
- Dimension selector placement (DESIGN-007) — separate floating control, top-right
  area or header; coordinated with DESIGN-007 when that ticket is implemented

## Test Coverage

- [ ] e2e: legend element is present in the map container (not sidebar) after load
- [ ] e2e: all district color swatches are visible in the legend
- [ ] e2e: legend label contains the scenario region name and district number
- [ ] Unit: N/A — layout is DOM/CSS only

## References

- Raised during Sprint 2 demo review (2026-04-26)
- DESIGN-007 — dimension selector placement (separate floating control; not part of legend)
- `game/web/index.html` — `#legend-container`, `#sidebar`, `#map-container`
- `game/web/src/main.ts` — legend rendering logic
