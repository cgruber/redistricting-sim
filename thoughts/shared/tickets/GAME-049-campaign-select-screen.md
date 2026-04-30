---
id: GAME-049
title: Campaign select screen
area: game, UX
status: open
created: 2026-04-29
---

## Summary

Build the campaign select screen: a page showing both v1 campaigns (Tutorial
and Educational) with per-campaign progress indicators. Clicking a campaign
navigates to the scenario select screen filtered to that campaign (GAME-048).
A Back button returns to the main menu (GAME-050). This screen becomes the
intermediate navigation layer between the main menu and individual scenarios.

## Current State

No campaign select screen exists. The scenario select screen is the only
navigation layer above individual scenarios.

## Goals / Acceptance Criteria

- [ ] Campaign select screen renders at `?view=campaigns` (or equivalent routing)
- [ ] Both campaigns displayed in order: Tutorial, then Educational Campaign
- [ ] Each campaign card shows:
  - Campaign title
  - Campaign description
  - Progress indicator: "N / M scenarios complete" (from localStorage completion data)
- [ ] Clicking a campaign navigates to `?campaign=<id>` (scenario select for that campaign)
- [ ] **Back** button navigates to the main menu (GAME-050 ships first; this ticket
  depends on GAME-050 being complete)
- [ ] Visual styling consistent with existing screen conventions (dark HUD chrome)

## Test Coverage

- [ ] e2e test: `?view=campaigns` renders both campaign titles
- [ ] e2e test: clicking the Tutorial campaign navigates to `?campaign=tutorial`
- [ ] e2e test: clicking the Educational Campaign navigates to `?campaign=educational`
- [ ] e2e test: progress indicator shows "0 / 2 scenarios complete" for Tutorial
  when no scenarios are complete (fresh localStorage state)
- [ ] e2e test: Back button is present on the campaign select screen

## References

- `game/web/src/main.ts` — current routing and screen rendering
- `thoughts/shared/tickets/GAME-047-campaign-data-model.md` — Campaign registry (prerequisite)
- `thoughts/shared/tickets/GAME-048-campaign-driven-scenario-select.md` — destination screen
- `thoughts/shared/tickets/GAME-050-main-menu.md` — destination of Back button
- `thoughts/shared/tickets/GAME-030-main-menu-and-campaigns.md` — parent design doc
