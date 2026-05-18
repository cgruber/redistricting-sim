---
id: GAME-074
title: "Criteria-only validity model: deprecate dual validity/criteria system"
area: game, architecture, scenario-format
status: open
created: 2026-05-18
---

## Summary

Implement the criteria-only validity model per the ADR
(`thoughts/shared/decisions/2026-05-18-criteria-only-validity-model.md`).
The dual validity/criteria system is collapsed into a single model: scenario success
criteria are the sole source of truth for what a map must achieve. The only engine
invariant (not a scenario criterion) is "all precincts assigned." Everything else —
population balance, contiguity, compactness — becomes an explicit, opt-in scenario
criterion. This removes the `mapIsValid` gate, `isMapSubmittable`, `buildValidityRows`,
and the `rules.population_tolerance` / `rules.contiguity` fields.

## Current State

- `validity.ts` computes `isMapSubmittable` from `rules.*`; gates `overallPass`
- `buildValidityRows` emits synthetic diagnostic rows that duplicate scenario criteria
- `rules.population_tolerance` and the `population_balance` criterion express the same
  constraint in two places; a suppression workaround was added 2026-05-18
- `rules.contiguity` encodes a US legal requirement as a universal engine rule

## Goals / Acceptance Criteria

### Schema

- [ ] `population_balance` criterion gains required `tolerance` field (e.g. `"tolerance": 0.05`);
      loader validates it; evaluate.ts reads tolerance from criterion spec
- [ ] `contiguity` added as a new criterion type (`{ "type": "contiguity" }`); evaluated
      using the existing BFS/contiguity logic currently in `validity.ts`
- [ ] `rules.population_tolerance` removed from schema and loader
- [ ] `rules.contiguity` removed from schema and loader
- [ ] Loader emits a warning (not error) if a non-empty `rules` block is present
      (forward-compat grace period)
- [ ] `rules` block may be omitted entirely in scenario JSON with no error

### Logic

- [ ] `isMapSubmittable` removed
- [ ] `mapIsValid` removed; `overallPass` = all required criteria pass AND
      `validity.unassignedCount === 0`
- [ ] `buildValidityRows` removed; May-2026 duplicate-suppression code removed
- [ ] `computeValidityStats` retains only all-assigned + district-in-use checks
      (still needed for `district_count` criterion evaluation)
- [ ] Population deviation check in `computeValidityStats` removed (now in criterion)
- [ ] Contiguity check in `computeValidityStats` removed (now in criterion evaluator)

### Migration: scenario JSON files

All 10 scenario files updated:
- [ ] `tutorial-001.json`: remove `rules.population_tolerance`; add `"tolerance": 0.05`
      to `population_balance` criterion; remove `rules.contiguity`; add `contiguity` criterion
- [ ] `tutorial-002.json`: same migration
- [ ] `scenario-002.json` through `scenario-009.json`: same migration for each
- [ ] `rules` block removed from all scenario files after migration

### Result screen

- [ ] Result screen shows only scenario criteria rows (no more `validity:*` rows)
- [ ] If all precincts unassigned, a pre-submit UI warning is shown (existing behaviour
      retained — this is an engine check, not a criterion); does NOT appear on result screen

## Test Coverage

- [ ] Unit: `population_balance` criterion reads tolerance from criterion spec
- [ ] Unit: `contiguity` criterion evaluates correctly (BFS pass/fail per district)
- [ ] Unit: `overallPass` is false when unassigned precincts exist, regardless of criteria
- [ ] e2e: result screen shows no `validity:*` rows on tutorial-001 invalid submission
- [ ] e2e: `population_balance` criterion FAIL row shown on imbalanced tutorial-001 map
- [ ] e2e: `contiguity` criterion FAIL row shown on non-contiguous map
- [ ] Loader test: scenario without `rules` block loads without error
- [ ] Loader test: `population_balance` without `tolerance` → loader error

## References

- ADR: `thoughts/shared/decisions/2026-05-18-criteria-only-validity-model.md`
- `game/web/src/simulation/validity.ts`
- `game/web/src/simulation/evaluate.ts`
- `game/web/src/model/scenario.ts`
- `game/web/src/model/loader.ts`
- `game/web/src/main.ts` — `buildValidityRows`, `isMapSubmittable`, `overallPass`
- `game/scenarios/*.json` — all 10 scenario files require migration
