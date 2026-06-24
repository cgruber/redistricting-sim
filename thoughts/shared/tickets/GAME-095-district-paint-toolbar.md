---
id: GAME-095
title: District paint toolbar — left-side expandable buttons (mirror of the view filters)
area: game, UX
status: resolved
created: 2026-06-24
---

## Summary

Move the district-selection buttons out of the top header into a left-side toolbar
over the map, mirroring the right-side view filter toolbar (GAME-093). Same
expand/collapse pattern: full "District N" labels by default, collapse to just the
number on the district's color.

## Resolution

- New `#district-toolbar` absolutely positioned top-left inside `#map-container`,
  expandable with a "Paint Districts" toggle (chevron + title; collapses to icons).
- District buttons (`renderDistrictButtons`) restructured: each button now holds a
  `.district-num` (e.g. "1") shown when collapsed and a `.district-label`
  ("District 1") shown when expanded, on the district's color. `data-tip` + `aria-label`
  per button; active district keeps the white ring.
- Removed the header "Draw district:" label + the in-header `#district-buttons`.
- Rounded (10px) buttons matching the view toolbar; theme tooltip (collapsed) anchored
  to the right (this toolbar hugs the left edge). Collapse state persists in localStorage.
- Cleaned up dead CSS for the removed header toggle buttons.
- e2e: existing `.district-btn` click flows still pass; `#district-buttons` role/group
  preserved.

## Follow-ups (deferred)

- [ ] Real icons/swatches (asset pass, with GAME-093).
- [ ] DESIGN-015 (information-density redesign) — fold both map toolbars into that layout.
- [ ] Demographic rollup (GAME-080) stat still renders under each button when expanded.

## References

- `game/web/index.html` (#district-toolbar), `game/web/styles.css`,
  `game/web/src/render/panels.ts` (renderDistrictButtons), `game/web/src/main.ts`.
- Mirror of GAME-093 (view filter toolbar). Relates to DESIGN-015, GAME-080.
