---
id: GAME-013
title: Reset-to-initial district assignments
area: game, rendering
status: open
created: 2026-04-25
github_issue: 62
---

## Summary

Add a "Reset" action that restores all precinct assignments to the scenario's
initial state and clears the undo history. Because reset is destructive and
irreversible, it requires a confirmation gesture before executing.

## Current State

No reset mechanism exists. Players can undo step-by-step, but there is no way
to return to the scenario starting state in one action. The undo store's
`clear()` API is available but unused.

## Goals / Acceptance Criteria

- [ ] "Reset" button visible in the sidebar or toolbar
- [ ] Clicking Reset shows a confirmation prompt (e.g. an inline confirmation
  row — "Are you sure? [Confirm] [Cancel]" — or a modal dialog)
- [ ] On confirmation: all precinct assignments restored to
  `scenario.precincts[*].initial_district_id` values
- [ ] On confirmation: undo/redo history cleared via
  `temporalStore.getState().clear()`
- [ ] On cancel: no change; player returns to current state
- [ ] Undo/redo buttons reflect cleared history immediately after reset
  (Undo disabled, Redo disabled)
- [ ] Map re-renders to show initial assignment colors

## Test Coverage

### Unit tests
None required — `resetToInitial` in the store depends on zustand/zundo which are not straightforwardly importable in the hand-rolled Node runner. Behavioral coverage via e2e is sufficient.

### E2e tests (`e2e/sprint2.spec.ts`)
- [x] Reset button is visible on load
- [x] Clicking Reset: confirm row appears; map unchanged
- [x] Clicking Cancel: confirm row hides; map unchanged; undo state preserved
- [x] Full flow: paint a precinct → click Reset → confirm → fills restored to initial; undo disabled

## Notes

- The confirmation gesture prevents accidental resets during play. An inline
  "Are you sure?" row is lower friction than a modal and consistent with the
  game's minimal-UI aesthetic.
- `temporalStore.getState().clear()` wipes both past and future states. After
  reset the undo button must be disabled — verify the Zustand temporal store
  re-evaluates `pastStates.length` reactively.
- The reset target is the scenario's `initial_district_id` values, which the
  loader stores on the `Precinct` objects. No re-fetch needed.

## References

- `game/web/src/store/gameStore.ts` — Zustand store, `temporalStore`
- `game/web/src/render/mapRenderer.ts` — paint and undo button wiring
- `game/web/src/model/loader.ts` — `initial_district_id` auto-fill logic
