---
id: GAME-011
title: Precinct info panel — hover tooltip in sidebar
area: game, rendering
status: open
created: 2026-04-25
github_issue: 58
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

- [x] Sidebar section `#precinct-info` added at top of sidebar (above election results)
- [x] Fixed-height container (min-height 80px); does not shift layout when content changes
- [x] Shows placeholder text when no precinct is hovered
- [x] On precinct hover: displays precinct name, current district, population (+ partisan lean)
- [x] Styling: `#0a1f3a` background with border; distinct from rest of sidebar
- [x] Existing `#status-bar` removed; instructions moved to placeholder text
- [x] `initHoverEvents()` updated to write to `#precinct-info`; mouseout restores placeholder
- [x] `name?: string` added to spike Precinct type (types.ts); adapter.ts populates from scenario

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
