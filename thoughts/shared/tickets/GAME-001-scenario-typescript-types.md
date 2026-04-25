---
id: GAME-001
title: Define scenario TypeScript types from spec
area: game, core, types
status: open
created: 2026-04-25
github_issue: 31
---

## Summary

Implement all TypeScript types from the scenario data format spec in the game
source tree. These are the canonical data types for the entire game — the loader,
simulation engine, renderer, and store all build on them.

## Current State

The spike (`game/web/src/model/types.ts`) has its own simplified types:
hardcoded `PartyKey = "R" | "D" | "L" | "G" | "I"`, a flat `Precinct` with
a `partyShare: PartyShare` field, and no demographic group model. These are
spike-grade and must be superseded by spec-grade types for the real implementation.

Spike types should be left in place for now — the procedural generator still
uses them and the spike renderer depends on them. New types go in new files;
the two type systems coexist until the GAME-005 integration replaces the generator.

## Goals / Acceptance Criteria

- [x] New file(s) under `game/web/src/model/` (e.g. `scenario.ts`) defining:
  - Opaque string branded types: `ScenarioId`, `PartyId`, `DistrictId`,
    `PrecinctId`, `GroupId`, `EventId`, `CriterionId`, `RegionId`
  - `Scenario` top-level interface (all fields from spec, including `default_district_id?`)
  - `RegionSpec`, `GeometrySpec` (discriminated union hex_axial | custom), `Party`,
    `District`, `Precinct`, `HexAxialPosition`, `CartesianPosition`
  - `DemographicGroup` (including `name?` and `dimensions?`), `GroupSchema`,
    `EligibilityRule`
  - `DemographicEvent` (discriminated union: turnout_shift | vote_share_shift |
    population_shift), `GroupFilter`, `PrecinctFilter`
  - `ScenarioRules` (contiguity: "required" | "preferred" | "allowed")
  - `SuccessCriterion`, `Criterion` (full discriminated union from spec including
    `district_count` and `min_eligible_share`), `CompareOp`
  - `Narrative`, `Slide`
  - `StateContext`, `RegionResult`
- [x] No hardcoded party keys; `PartyId` is a plain `string` branded type
- [x] Strict TypeScript compiles cleanly (`tsc --noEmit`)
- [x] Existing spike types (`game/web/src/model/types.ts`) untouched

## References

- Spec: `thoughts/shared/decisions/2026-04-24-scenario-data-format.md`
- Spike types: `game/web/src/model/types.ts` (to understand what exists)
