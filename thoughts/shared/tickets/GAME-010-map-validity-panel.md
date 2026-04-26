---
id: GAME-010
title: Map validity panel — population balance, contiguity, unassigned
area: game, rendering
status: open
created: 2026-04-25
---

## Summary

Add a persistent validity panel (sidebar section or bottom bar) that shows the
current state of the player's district assignments in real time:

- Per-district population balance (% deviation from ideal)
- Count of unassigned precincts
- Contiguity status per district (valid | warning | violation — depending on
  scenario rules)

This gives the player actionable feedback without requiring them to run the
full Test sequence.

## Current State

No live feedback exists. The status bar at the bottom shows a static message.
Population totals are available in the store but not displayed. Contiguity is
not computed at all.

## Goals / Acceptance Criteria

### Population balance
- [ ] Compute ideal population = `totalPop / districtCount`
- [ ] Display per-district actual population and `±N%` deviation from ideal
- [ ] ±5% threshold used as the Sprint 2 placeholder (to be tuned in later
  sprints once scoring is implemented)
- [ ] Districts within threshold shown as "ok"; outside shown as "over" / "under"

### Unassigned precincts
- [ ] Display count of unassigned precincts (precincts with no district assignment)
- [ ] Count updates live as the player paints

### Contiguity
- [ ] Contiguity check behavior driven by `scenario.rules.contiguity`:
  - `"required"` → non-contiguous districts flagged as invalid (red indicator)
  - `"warn"` → non-contiguous districts flagged as warnings (yellow indicator)
  - `"allowed"` → no contiguity check or indicator shown
- [ ] Contiguity computed via BFS/DFS over `Precinct.neighbors` per district
- [ ] Scenario spec extended to include `rules.contiguity` field; tutorial-001
  scenario JSON updated to `"required"` (30-precinct grid, all precincts
  reachable — contiguity always valid in the tutorial)

### Panel layout
- [ ] Panel lives in the sidebar (below the district buttons), with sufficient
  contrast to be noticed
- [ ] Updates reactively on every store change (no manual refresh needed)

## Notes

- Contiguity algorithm: for each district, collect all precincts in that
  district; BFS from any one precinct using `neighbors` filtered to same
  district; if any precinct is not reached → non-contiguous.
- `Precinct.neighbors` is already populated by the loader from the scenario
  JSON adjacency data.
- The `rules` field is a new addition to the `Scenario` TypeScript type and
  JSON schema. Validator must enforce it.
- Contiguity check on every paint event is O(precincts-in-district) — fine for
  Sprint 2 scenario sizes (≤300 precincts). No optimization needed yet.

## References

- `game/web/src/store/gameStore.ts` — district assignment state
- `game/web/src/model/types.ts` — `Scenario`, `Precinct`, `District` types
- `game/web/src/model/loader.ts` — scenario loading and validation
- `game/web/src/render/mapRenderer.ts` — existing UI layout reference
- `thoughts/shared/tickets/GAME-001-scenario-ts-types.md` — type definitions
