---
id: GAME-002
title: Scenario JSON loader and validator
area: game, core, data
status: open
created: 2026-04-25
---

## Summary

Implement a `loadScenario` function that parses raw JSON into a typed `Scenario`
and validates all spec invariants. This is the boundary between the file system
and the game engine — everything downstream can trust the result is valid.

## Current State

No loader exists. The spike uses a procedural generator (`game/web/src/model/generator.ts`)
to create precincts at runtime. The loader replaces that data source.

## Goals / Acceptance Criteria

- [ ] `loadScenario(json: unknown): Scenario` function in `game/web/src/model/`
- [ ] Rejects unknown `format_version`; throws a descriptive error
- [ ] Validates all 13 invariants from the spec:
  - All `PartyId` refs in `vote_shares`, events, criteria exist in `scenario.parties`
  - All `DistrictId` refs in `initial_district_id` exist in `scenario.districts`
  - All `GroupId` refs in events/criteria exist in ≥1 precinct's `demographic_groups`
  - Every context precinct (`editable: false`) has a non-null `initial_district_id`
  - `sum(population_shares) == 1.0` per precinct (±ε)
  - `sum(vote_shares) == 1.0` per group (±ε); all parties present
  - If `group_schema` declared: completeness constraint holds
  - hex_axial: no `neighbors` field on precincts
  - custom geometry: `neighbors` present and symmetric
  - custom geometry: all `PrecinctId` values in `neighbors[]` exist in `scenario.precincts`
  - `districts.length ≥ 2`
  - All ids unique within scenario
  - `precincts.length ≥ 1`
- [ ] `auto-fill` behaviour: editable precincts with absent/null `initial_district_id`
  are resolved to `default_district_id` (if set) or `districts[0]` at load time;
  returned `Scenario` always has explicit `initial_district_id` on editable precincts
- [ ] Error messages identify which invariant failed and where (e.g. precinct id)
- [ ] Unit tests: happy path + one test per invariant violation
- [ ] Depends on: GAME-001

## References

- Spec invariants: `thoughts/shared/decisions/2026-04-24-scenario-data-format.md` §Validation Invariants
- Types: GAME-001
