---
id: GAME-005
title: Sprint 1 integration — render scenario from JSON
area: game, rendering, integration
status: open
created: 2026-04-25
---

## Summary

Wire the scenario loader (GAME-002) and tutorial scenario JSON (GAME-003) into
the renderer (GAME-004). Replace the procedural generator as the data source.
At the end of this ticket, the app renders a real scenario and the player can
paint districts.

This is the Sprint 1 demo milestone.

## Current State

The app loads precincts from the procedural generator (`generator.ts`). The
renderer, store, and simulation all use spike-grade types. The goal is to
swap the data source without breaking the rendering and editing experience.

## Goals / Acceptance Criteria

- [ ] App loads `tutorial-001.json` at startup (hardcoded path / static import for now;
  scenario picker is a later sprint)
- [ ] Scenario passed through `loadScenario()` before use; validation errors surface
  clearly in the browser console (no silent failures)
- [ ] Precincts rendered at correct hex positions from `scenario.precincts[*].position`
- [ ] Initial district assignments from `initial_district_id` applied (or auto-fill
  if null) before first render
- [ ] District color overlay rendered; district boundaries drawn between adjacent
  precincts in different districts
- [ ] Paint/brush interaction works: stroking assigns precincts to active district
- [ ] Undo/redo works
- [ ] View mode toggle works (districts ↔ partisan lean)
  - Partisan lean derived from scenario's demographic groups + vote_shares
    (population-weighted average across groups for now — full group model is Sprint 3)
- [ ] Viewport panning works (CSS transform; existing spike behaviour)
- [ ] Spike types (`types.ts`, `generator.ts`) and spike entry point left in place
  but no longer the primary data path; they can be deleted in a follow-up
- [ ] `bazel build //game/web/...` passes; app serves and renders correctly

**Sprint 1 demo**: open browser via `serve.sh`, see tutorial scenario map, paint
districts, undo/redo, toggle view mode. No simulation, no test sequence yet.

## Notes

- The Zustand store's `GameState` will need to accommodate `Scenario` types rather
  than spike types. Decide whether to update the store types in this ticket or keep
  a thin adapter layer — whichever produces less churn for Sprint 2.
- The spike simulation (`election.ts`) does not need to be replaced this sprint;
  it can continue to run against adapted types if the mapping is simple, or be
  temporarily disabled. Simulation replacement is Sprint 3.

## Dependencies

- GAME-001 (types)
- GAME-002 (loader)
- GAME-003 (tutorial scenario JSON)
- GAME-004 (MapRenderer interface)

## References

- Spike entry: `game/web/src/main.ts`
- Spike store: `game/web/src/store/gameStore.ts`
- Spike renderer: `game/web/src/render/mapRenderer.ts`
- Spike generator: `game/web/src/model/generator.ts`
