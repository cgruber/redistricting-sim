---
id: GAME-081
title: Information density implementation — game state layout improvements
area: game, UX
status: open
created: 2026-05-18
---

## Summary

Implement the layout approach selected in DESIGN-015 to resolve the 5-district sidebar
overflow problem and surface game state information without requiring the player to scroll.

## Current State

With 5 or more districts, the right sidebar overflows: map validity panel and precinct
hover detail are pushed below the fold. Players cannot see overall map status while
actively painting. Once GAME-080 ships, the demographic stat adds further pressure.

## Goals / Acceptance Criteria

- [ ] DESIGN-015 approved before implementation begins
- [ ] Chosen layout approach implemented per DESIGN-015 spec
- [ ] 5-district scenario (scenario-007 or similar) fits without scrolling at standard
      desktop viewport (1280px wide)
- [ ] District selector, validity summary, and precinct hover detail all visible
      simultaneously
- [ ] GAME-080 Phase 1 demographic stat integrates cleanly into new layout
- [ ] If DESIGN-004 is absorbed: legend strip implementation included
- [ ] Viewport behavior at narrower widths (1024px) verified; no broken layouts

## Test Coverage

- [ ] e2e: 5-district scenario — district buttons, validity panel, and precinct hover
      panel all visible without scroll
- [ ] e2e: layout stable across precinct hover, district select, paint actions
- [ ] e2e: no regression on 3-district scenarios (tutorial, simple scenarios)
- [ ] e2e: legend visible in new position (if DESIGN-004 absorbed)

## References

- DESIGN-015 — layout design spec (must be approved first)
- GAME-080 — district demographic rollup (coordinate placement of demographic stat)
- DESIGN-004 — legend layout (may be absorbed here)
- `game/web/styles.css` — layout
- `game/web/index.html` — sidebar structure
