---
id: GAME-007
title: Player progress persistence — save/resume game state
area: game, storage
status: resolved
created: 2026-04-25
github_issue: 99
---

## Summary

Players can save their current game state and return to it later. Two distinct
persistence concerns are handled here: (1) in-progress scenario resume ("Continue"
from the main menu); (2) scenario completion tracking (which scenarios are done,
which optional criteria were achieved). Both use local browser storage — no user
accounts, no server game state.

## Current State

No persistence exists. The game resets on page reload. The game vision calls out
`local browser storage (IndexedDB/localStorage)` as the v1 mechanism, with no
user accounts.

## Goals / Acceptance Criteria

**In-progress scenario save/resume:**
- [ ] When the player is in an active scenario, their current district assignment
  map is saved to storage on every meaningful state change (debounced; not on
  every single paint stroke)
- [ ] On returning to the game (page load / "Continue" from menu), the player
  can resume from their last assignment state for the most recent in-progress scenario
- [ ] "Continue" is shown on the main menu only when an in-progress scenario exists
- [ ] Resuming correctly restores: assignment map, active scenario, active district
- [ ] Clearing an in-progress save (e.g. after completing the scenario) removes it

**Scenario completion tracking:**
- [ ] When a player completes a scenario (all required criteria pass), completion
  is recorded: scenario id, required criteria all passed, which optional criteria
  passed (for achievement/star display)
- [ ] Completed scenarios are shown as completed in the scenario select screen
  (Sprint 6), with achievement status
- [ ] Sequential unlock: completing scenario N unlocks scenario N+1
- [ ] Completion state survives page reload

**Storage:**
- [ ] Use `localStorage` for simplicity if data volume is small (assignment maps
  for ~300 precincts per scenario compress well as a JSON object); fall back to
  IndexedDB if localStorage quota becomes a concern
- [ ] Storage key prefix namespaced to avoid collisions (e.g. `redistricting-sim/`)
- [ ] Graceful degradation if storage is unavailable (private browsing quotas):
  game works; progress just isn't saved; user informed via a one-time notice

**Sprint placement**: Sprint 6 (game infrastructure), alongside scenario select
and unlock system. The "Continue" menu item is part of the same sprint.

## Notes

- Assignment map is `Map<PrecinctId, DistrictId>` — serialises to a plain object
  for JSON storage. ~300 entries × ~20 bytes each ≈ 6 KB uncompressed per scenario;
  localStorage quota (5–10 MB) is not a concern for v1.
- Only one in-progress scenario at a time (player can only be mid-one-scenario).
  If they start a new scenario, the old in-progress state is discarded (or prompt
  to confirm abandonment — UX decision at implementation time).
- Completion records are small (scenario id + boolean array) and accumulate across
  all scenarios; easily within localStorage quota.

## References

- Game vision: `thoughts/shared/vision/game-vision.compressed.md`
  §MENU (Continue item), §PROGRESSION (unlock), §V1_SCOPE (localStorage)
- Scenario data format: `thoughts/shared/decisions/2026-04-24-scenario-data-format.md`
  (PrecinctId, DistrictId types used in assignment map)
- Related: DESIGN-001 (achievement/star system — optional criteria completion
  is part of the state saved here)
