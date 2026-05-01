---
id: GAME-054
title: Remove legacy scenario select and fix invalid campaign redirect
area: game, UX, routing
status: resolved
created: 2026-04-30
---

## Summary

The standalone `?view=scenarios` route (scenario select without campaign context) is now
obsolete — all scenarios are reached via campaigns (GAME-048/GAME-049). Remove it as a
user-facing entry point and redirect stale URLs to the main menu. Also fix `?campaign=<bogus>`
which currently falls back to showing all 9 scenarios; it should redirect to main menu instead.

## Current State

- `?view=scenarios` shows a standalone scenario select listing all 9 scenarios (no campaign context).
- `?campaign=bogus` falls back to showing all 9 scenarios with the Back button hidden.
- Both are user-visible dead ends left over from before campaigns existed.

## Goals / Acceptance Criteria

- [ ] `?campaign=<invalid>` (any unrecognized id) → `window.location.replace("./")` → main menu
- [ ] `?view=scenarios` → `window.location.replace("./")` → main menu
- [ ] Unknown `?s=<id>` without campaign → `window.location.replace("./")` → main menu (was: scenario select)
- [ ] Unknown `?s=<id>` with campaign → show campaign's scenario select (stay in campaign context)
- [ ] Locked scenario (no campaign context) → main menu (was: scenario select)
- [ ] `backUrl` for no-campaign scenarios points to `./` (main menu), not `./?view=scenarios`
- [ ] Error screen back button label updated to "← Main Menu" for no-campaign context

## Test Coverage

- [ ] e2e: `?campaign=bogus` → `#main-menu` visible, `#scenario-select` not visible
- [ ] e2e: `?view=scenarios` → `#main-menu` visible, `#scenario-select` not visible
- [ ] e2e: All existing scenario-select-dependent tests updated to use campaign URLs
- [ ] e2e: Lock gate test updated to expect `#main-menu` not `#scenario-select`
- [ ] e2e: Debug force-win test updated (no-campaign → `backUrl` → main menu)
- [ ] e2e: Unknown `?s=` without campaign → `#main-menu` visible

## References

- `game/web/src/main.ts` — routing block, campaignParam setup, backUrl, locked/unknown routing
- `game/web/e2e/scenarios.spec.ts` — tests at lines 745, 868, 902, 908, 916
- `game/web/e2e/sprint1.spec.ts`, `sprint2.spec.ts`, `sprint3.spec.ts` — `?view=scenarios` helpers
- `game/web/e2e/smoke.spec.ts` — `?view=scenarios` usage
- `thoughts/shared/tickets/GAME-048-campaign-driven-scenario-select.md` — campaign filtering
- `thoughts/shared/tickets/GAME-050-main-menu.md` — main menu (redirect target)
