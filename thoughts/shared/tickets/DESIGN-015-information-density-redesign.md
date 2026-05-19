---
id: DESIGN-015
title: Information density redesign — surfacing game state at 5+ districts without scrolling
area: design, UX
status: open
created: 2026-05-18
---

## Summary

With 5 districts the right sidebar scrolls off-screen, hiding game state information the
player needs while actively painting. The sidebar is currently doing too many jobs: district
selector, population validity, precinct detail on hover, and (once GAME-080 ships) district
demographic stats. This design ticket defines the right layout approach before implementation
begins (GAME-081).

The constraint: the map must remain the dominant visual element. Information density must
increase without visually crowding the map or burying the district selector.

## Current sidebar jobs (in order from top to bottom)

1. District selector buttons (with population balance; soon demographic stat per GAME-080)
2. Map validity panel (contiguous, balanced, unassigned count)
3. Precinct hover detail (population, lean, demographics on mouseover)

With 5 districts, item 1 alone can overflow. Items 2 and 3 are pushed below the fold.

## Options to evaluate

**Option A — District overlays on the map**
Key per-district stats (district label, population %, demographic %) rendered as SVG text
overlaid inside each district's hex cluster. The sidebar district buttons become compact
(just color + label, no inline stats). Stats live on the map where the player's eye already is.

Pros: eliminates sidebar overflow; stats are spatially connected to the district.
Cons: text placement on irregular hex clusters is tricky (centroid calculation, avoiding
overlap); small text may be hard to read over colored hexes; clutters the map.

**Option B — Tabbed / collapsible sidebar**
Sidebar gains tabs or accordion sections: "Districts" tab (selector + stats), "Map" tab
(validity panel), "Precinct" tab (hover detail). Player switches between views.

Pros: all info still in sidebar; no map changes.
Cons: adds cognitive overhead; player can't see precinct detail and district stats simultaneously.

**Option C — HUD strip above or below map**
A thin horizontal strip above or below the map shows: 5 district color swatches with population %
and demographic %; overall validity indicators. Sidebar retains precinct hover detail only.
Coordinates with DESIGN-004 (legend → horizontal strip).

Pros: frees sidebar entirely for precinct detail; district status always visible regardless
of map size; no overlap with map content.
Cons: takes vertical screen space; district strip + legend strip + map + sidebar may feel crowded.

**Option D — Combined: compact map overlays + slim sidebar**
District labels + key stat (population balance only) overlaid on map as in Option A.
Sidebar retains precinct hover detail + a condensed validity summary. Demographic stat
(GAME-080) shown in a small district detail area that appears when a district is active,
not always-visible.

Pros: map carries spatial district info; sidebar stays focused on precinct detail.
Cons: requires map overlay rendering work; detail panel is click-activated, not always visible.

## Design decision required

Choose one approach (or a hybrid), specify:
1. What information moves where
2. How district demographic stat (GAME-080 Phase 1) fits into the chosen layout
3. How the layout behaves at different viewport widths (desktop-first but not desktop-only)
4. How the active district is visually indicated in the new layout
5. Whether DESIGN-004 (legend strip) is folded into this work or stays separate

## Relationship to DESIGN-004

DESIGN-004 proposes moving the legend to a horizontal strip above the map, freeing sidebar
space. That work is complementary: if DESIGN-015 also uses a horizontal strip (Option C),
the two can be combined. If DESIGN-015 takes a different approach, DESIGN-004 remains
independent. This ticket should decide whether to absorb or defer DESIGN-004.

## Goals / Acceptance Criteria

- [ ] All four options (or others) evaluated against constraints
- [ ] One approach chosen with rationale documented
- [ ] Visual spec produced: layout diagram or annotated mockup (ASCII or simple SVG is fine)
- [ ] GAME-080 Phase 1 demographic stat placement specified in chosen layout
- [ ] DESIGN-004 fate decided: absorb into GAME-081 or keep separate
- [ ] Viewport behavior at narrower desktop widths specified

## References

- GAME-081 — implementation (trails this)
- GAME-080 — district demographic rollup (phase 1 stat must fit in chosen layout)
- DESIGN-004 — legend layout (horizontal strip; potentially absorbed here)
- `game/web/styles.css` — current sidebar layout
- `game/web/index.html` — current sidebar structure
- Visual aesthetic: dark HUD chrome, map-first, strategy-game feel
  (`thoughts/shared/vision/game-vision.compressed.md`)
