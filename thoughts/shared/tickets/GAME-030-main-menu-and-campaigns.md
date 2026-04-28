---
id: GAME-030
title: Main menu, campaign model, and navigation overhaul
area: game, UX, architecture
status: open
created: 2026-04-27
---

## Summary

Replace the current scenario-select-as-home-screen with a proper main menu,
campaign model, and layered navigation. The game should feel like a real game
with a title screen, not a scenario picker that doubles as everything.

## Current State

The scenario select screen serves as the home screen — it's the first thing
returning players see. There is no title screen, no campaign concept, no
settings, and the "About" and "Reset Campaign" buttons are tacked on.
Scenarios are hardcoded in SCENARIO_MANIFEST.

## Design

### Main Menu Screen
- Full-screen with game art/logo ("Past the Post")
- Vertical menu on the left:
  - **Continue** (visible only when a campaign is in progress)
  - **New Campaign**
  - **Load** (greyed out until save/load feature is ready)
  - **Settings** (greyed out until settings feature is ready)
  - **About** (opens existing about page)

### Campaign Model
- A campaign is a named collection of scenarios with ordering
- The v1 educational campaign is the only campaign; others are future
- Campaign data structure: `{ id, title, description, scenarioIds: string[] }`
- Campaign completion tracked per-campaign in localStorage

### Campaign Select Screen
- Shows available campaigns (initially just the one educational campaign)
- Each campaign card: title, description, progress indicator
- Back button returns to main menu
- Clicking a campaign opens the scenario select screen

### Scenario Select Screen
- No longer the home screen — accessed through a campaign
- Scenario list generated from the campaign's `scenarioIds`, not hardcoded
- Back button returns to campaign select (not main menu)

### In-Game Navigation
- The "← Scenarios" button becomes a menu with:
  - "Return to Scenarios" (back to scenario select within current campaign)
  - "Return to Main Menu" (back to main menu)

## Goals / Acceptance Criteria

- [ ] Main menu screen with art/logo and vertical navigation
- [ ] Campaign data model: id, title, description, scenarioIds
- [ ] Campaign select screen showing available campaigns
- [ ] Scenario select screen driven by campaign data (not hardcoded manifest)
- [ ] In-game menu with "Return to Scenarios" and "Return to Main Menu" options
- [ ] Continue button on main menu when a campaign is in progress
- [ ] Load and Settings buttons present but greyed out / disabled
- [ ] About opens existing about page
- [ ] All existing e2e tests pass (may need updates for new navigation flow)

## Test Coverage

- [ ] e2e: main menu visible on fresh load; About/New Campaign buttons work
- [ ] e2e: New Campaign → campaign select → scenario select flow
- [ ] e2e: in-game menu navigation back to scenarios and main menu
- [ ] e2e: Continue button appears when campaign in progress

## References

- Game vision §MENU: "New Game | Continue | Custom Level | Settings | About"
- GAME-029 — about page (already implemented; move into main menu navigation)
- GAME-018 — scenario select + progression (refactored, not replaced)
- `game/web/src/main.ts` — current SCENARIO_MANIFEST and routing
