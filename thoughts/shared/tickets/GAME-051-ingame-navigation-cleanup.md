---
id: GAME-051
title: In-game navigation cleanup
area: game, UX
status: resolved
created: 2026-04-29
---

## Summary

Replace the flat "← Scenarios" back button in the in-game view with a context-
aware submenu offering two options: "Return to Scenarios" (back to the scenario
select within the current campaign) and "Return to Main Menu". This rounds out
the navigation stack so a player can always reach the main menu without using
the browser back button, and ensures the campaign context is preserved when
returning to the scenario list.

## Current State

The in-game header has a single "← Scenarios" button that navigates directly
back to the scenario select screen (no campaign context). There is no way to
reach the main menu from in-game without manually editing the URL.

## Goals / Acceptance Criteria

- [ ] "← Scenarios" button replaced with a submenu trigger (e.g. "← Back ▾" or
  a named button that reveals two options on click/tap)
- [ ] Submenu contains:
  - **Return to Scenarios** — navigates to `?campaign=<currentCampaignId>`; only
    shown when a campaign is active (no fallback to standalone scenario select,
    which was removed in GAME-054)
  - **Return to Main Menu** — navigates to `/` (app root, main menu)
- [ ] Submenu closes when clicking outside it (or pressing Escape)
- [ ] If no campaign context is available (direct URL access to a scenario),
  only "Return to Main Menu" is shown (standalone scenario select was removed in GAME-054)
- [ ] Campaign context propagated via URL parameter or in-page state so the
  in-game view knows which campaign to return to

## Test Coverage

- [ ] e2e test: in-game view has submenu trigger (no longer a direct "← Scenarios" link)
- [ ] e2e test: clicking the trigger reveals "Return to Scenarios" and "Return to Main Menu"
- [ ] e2e test: "Return to Scenarios" navigates to the campaign-filtered scenario select
- [ ] e2e test: "Return to Main Menu" navigates to the app root
- [ ] e2e test: submenu closes on Escape key

## References

- `game/web/src/main.ts` — in-game header and current back button
- `thoughts/shared/tickets/GAME-050-main-menu.md` — destination of Return to Main Menu
- `thoughts/shared/tickets/GAME-048-campaign-driven-scenario-select.md` — destination of Return to Scenarios
- `thoughts/shared/tickets/GAME-030-main-menu-and-campaigns.md` — parent design doc
