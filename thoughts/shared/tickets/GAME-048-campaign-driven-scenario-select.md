---
id: GAME-048
title: Campaign-driven scenario select (routing + data wiring)
area: game, UX
status: resolved
created: 2026-04-29
github_issue: 161
github_pr: 162
---

## Summary

Update the scenario select screen to operate within the context of a campaign.
The screen receives a campaign ID via URL parameter, filters the scenario list
to that campaign's `scenarioIds`, and provides a Back button that returns to
the campaign select screen. This ticket does not build the campaign select or
main menu screens — it makes the scenario select campaign-aware so those
screens can navigate into it cleanly.

## Current State

The scenario select screen shows all scenarios from `SCENARIO_MANIFEST` and
acts as the app home screen. There is no campaign parameter; the back button
does not exist. Completion tracking uses scenario IDs directly.

## Goals / Acceptance Criteria

- [ ] URL parameter `?campaign=<id>` accepted by the scenario select screen
- [ ] Scenario list filtered to the campaign's `scenarioIds` (order from campaign)
- [ ] If `?campaign=` is absent or unknown, fall back to showing all scenarios
  (preserves current behavior for direct URL access)
- [ ] **Back** button added to scenario select header — visible only when a
  `?campaign=` parameter is present; navigates to campaign select screen
  (`/` or `?view=campaigns`, per GAME-049 routing decision)
- [ ] Completion and unlock logic unchanged — still per-scenario-ID in localStorage
- [ ] Existing e2e tests for scenario select continue to pass

## Test Coverage

- [ ] e2e test: navigating to `?campaign=tutorial` shows only tutorial-001 and
  tutorial-002 in the list (not the nine main scenarios)
- [ ] e2e test: Back button is visible when `?campaign=tutorial` is in the URL
- [ ] e2e test: Back button is absent when no `?campaign=` parameter is present
- [ ] e2e test: navigating without `?campaign=` still shows all scenarios
  (regression guard on fallback behavior)

## References

- `game/web/src/main.ts` — scenario select rendering, URL param handling
- `thoughts/shared/tickets/GAME-047-campaign-data-model.md` — Campaign type + registry (prerequisite)
- `thoughts/shared/tickets/GAME-049-campaign-select-screen.md` — destination of Back button
- `thoughts/shared/tickets/GAME-030-main-menu-and-campaigns.md` — parent design doc
- `e2e/` — existing Playwright tests for scenario select
