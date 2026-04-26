---
id: GAME-011
title: Precinct info panel — hover tooltip in sidebar
area: game, rendering
status: open
created: 2026-04-25
---

## Summary

Replace the existing `#status-bar` bottom strip with a dedicated precinct info
section in the sidebar. When the player hovers over a precinct, display:

- Precinct name
- Current district assignment
- Population
- Any other precinct-level data surfaced by the scenario

The panel has a fixed-height container and shows a neutral placeholder ("Hover
over a precinct to see details") when no precinct is hovered.

## Current State

A thin status bar exists at the bottom of the viewport (`#status-bar`). It
shows minimal info and is easy to miss — the Sprint 1 demo confirmed players
did not notice it. Hover events are already wired via `initHoverEvents()` in
`mapRenderer.ts`.

## Goals / Acceptance Criteria

- [ ] Sidebar section `#precinct-info` added below the district buttons
- [ ] Fixed-height container; does not shift layout when content changes
- [ ] Shows placeholder text when no precinct is hovered
- [ ] On precinct hover: displays precinct name, current district, population
- [ ] Styling: distinct contrast from the rest of the sidebar so it is
  noticeable; not so prominent it distracts from the map
- [ ] Existing `#status-bar` removed (or repurposed if it serves another need)
- [ ] `initHoverEvents()` updated to write to `#precinct-info` instead of
  (or in addition to) `#status-bar`

## Notes

- The panel intentionally sits in the sidebar rather than as a floating tooltip
  to avoid interfering with the paint brush interaction area.
- The design should make the section visible-but-not-shouting: a slightly
  different background tone or a subtle border is sufficient.
- If `#status-bar` carries any other live data (e.g., keyboard hints), that
  content should be reviewed and either migrated or kept separately.

## References

- `game/web/src/render/mapRenderer.ts` — `initHoverEvents()`
- `game/web/index.html` — `#status-bar`, sidebar layout and inline styles
