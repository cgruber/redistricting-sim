---
id: GAME-050
title: Main menu / title screen
area: game, UX
status: resolved
created: 2026-04-29
github_issue: 164
github_pr: 165
---

## Summary

Build the main menu: a full-screen landing page with the game title ("Past the
Post") and a vertical navigation menu. This becomes the app entry point,
replacing the scenario select screen as the first thing a player sees.
The scenario select screen is now accessed through Campaign Select → Campaign.

## Current State

The scenario select screen is the app home screen. There is no title screen,
no "New Game" / "Continue" flow, and no top-level navigation.

## Goals / Acceptance Criteria

- [ ] Main menu renders at `/` (root, with no URL parameters) and is the default
  app entry point
- [ ] Game title "Past the Post" displayed prominently (logo or large heading)
- [ ] Vertical menu with the following items in order:
  - **Continue** — visible only when a `lastPlayedScenarioId` key exists in
    localStorage (set whenever the player enters any scenario); navigates
    directly to that scenario (bypasses both campaign select and scenario select)
  - **New Campaign** — navigates to campaign select (`?view=campaigns`)
  - **About** — opens the existing about page (GAME-029)
  - **Load** — rendered but visually disabled/greyed out with "(coming soon)" label
  - **Settings** — rendered but visually disabled/greyed out with "(coming soon)" label
- [ ] Continue button is absent (not disabled) when no campaign progress exists
- [ ] Existing About page reachable from main menu (not lost)

## Test Coverage

- [ ] e2e test: app root `/` renders the main menu (not the scenario select screen)
- [ ] e2e test: "New Campaign" button navigates to `?view=campaigns`
- [ ] e2e test: "About" button opens the about page
- [ ] e2e test: "Continue" button absent when localStorage has no campaign progress
- [ ] e2e test: "Continue" button present when `lastPlayedScenarioId` is set in localStorage
- [ ] e2e test: "Continue" navigates directly to that scenario (not to campaign select)
- [ ] e2e test: "Load" item is visible but not navigable (disabled state)
- [ ] e2e test: "Settings" item is visible but not navigable (disabled state)

## References

- `game/web/src/main.ts` — current entry point and routing
- `thoughts/shared/tickets/GAME-029-about-page.md` — about page (already implemented)
- `thoughts/shared/tickets/GAME-049-campaign-select-screen.md` — destination of New Campaign
- `thoughts/shared/tickets/GAME-048-campaign-driven-scenario-select.md` — destination of Continue
- `thoughts/shared/tickets/GAME-030-main-menu-and-campaigns.md` — parent design doc
- `thoughts/shared/vision/game-vision.compressed.md` — §MENU: "New Game | Continue | Custom Level | Settings | About"
