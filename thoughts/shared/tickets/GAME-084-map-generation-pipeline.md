---
id: GAME-084
title: Map generation pipeline — spec-driven, staged, single format
area: GAME
status: open
created: 2026-05-20
---

## Summary

Replace the current per-scenario bespoke generators with a staged pipeline that
produces scenario JSON incrementally. Each stage is independently tunable and
re-runnable. A human-readable spec file is the checked-in source of intent;
the scenario JSON is the compiled output.

## Current State

One `.main.kts` generator per scenario. Each hardcodes all positions, terrain,
demographics, and narrative. Generators are not reused and are effectively
orphaned after initial JSON production — incremental changes go directly to JSON.

## Design

### Pipeline stages

1. **Terrain generator** — takes a map spec, produces hex positions + terrain
   tiles (mountain, sea, lake) + lake clusters (explicit lakeside precincts) +
   river edges. No population or demographic data yet.
2. **Population stage** — takes terrain output + parameters (base density,
   hotspots, coastal/mountain gradients), adds `total_population` per precinct.
3. **Demographics stage** — takes populated map + parameters (regional lean
   gradients, competitive clusters, turnout distribution), adds
   `demographic_groups` per precinct.
4. **Scenario assembler** — takes enriched map + a scenario spec (narrative,
   parties, districts, success criteria), produces the final scenario JSON.

### Spec file

A lightweight, human-readable, tunable descriptor checked in alongside the
scenario JSON. Documents intent and allows pipeline re-runs from a clean state.
Agents tune the spec; the pipeline executes it.

### Single format throughout

All stages produce increasingly-complete scenario JSON — not separate
intermediate formats. This requires one loader change (see below) but avoids
maintaining multiple schemas.

## Loader change required

**Separate validation from loading.** Currently the loader validates completeness
(all precincts assigned, parties present, etc.) at load time. Change this to:
- Load tolerates absent optional fields (population, demographics, districts)
- Completeness validation runs at game-start only

This allows partial scenarios to be rendered for inspection (terrain preview
before demographics exist) and keeps the pipeline output format identical to
the final scenario format.

## Goals / Acceptance Criteria

- [x] Loader separates load-time parsing from game-start completeness validation
- [ ] Terrain generator: takes map spec, produces valid (partial) scenario JSON
      with hex positions + terrain tiles + lake clusters + river edges
- [ ] Population stage: takes partial scenario JSON + params, enriches with
      `total_population` per precinct
- [ ] Demographics stage: takes populated scenario JSON + params, enriches with
      `demographic_groups`
- [ ] Scenario assembler: takes enriched JSON + scenario spec, produces final
      scenario JSON ready for gameplay
- [ ] Existing scenarios migrated to have a companion spec file
- [ ] Per-scenario bespoke generators removed

## Scope note

The pipeline is for new scenarios and reworked existing ones. The old generators
are not deleted until the pipeline covers their use cases.

## References

- GAME-041 (split loader) — prerequisite; `validateScenario()` must be a named function before the load/validate behavioral split can be done cleanly
- GAME-083: unassigned precinct visual feedback (related UX work)
- Discussed after tutorial-003 R=6 expansion (2026-05-20)
