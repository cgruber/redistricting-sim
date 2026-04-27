---
id: GAME-022
title: "Implement missing criterion evaluators: majority_minority, efficiency_gap, mean_median"
area: game, simulation
status: open
created: 2026-04-26
---

## Summary

Three criterion types currently return `passed: false` with "not yet implemented" in
`evaluate.ts`. Scenarios 3–4 (packing, cracking) need `efficiency_gap` and `mean_median`
to be real evaluators. Scenario 5 needs `majority_minority`. Implementing them makes those
criteria usable in scenario authoring and produces meaningful pass/fail feedback.

## Current State

```typescript
case "majority_minority":
case "efficiency_gap":
case "mean_median":
    passed = false;
    detail = `criterion type '${c.type}' is not yet implemented`;
    break;
```

## Evaluator Definitions

**majority_minority** (`min_eligible_share: number`)
A district passes if the share of the population in eligible demographic groups (specified
in the criterion config) meets or exceeds `min_eligible_share`. Uses
`demographic_groups[].population_share` weighted by group eligibility flags or IDs specified
in the criterion. Pass condition: at least one district (or a specified count) meets the
threshold — exact semantics TBD in implementation; criterion config should specify `count`
(default 1) and `group_ids`.

**efficiency_gap** (`max_gap: number`)
Wasted votes = votes cast for the losing party + votes cast for the winning party above the
threshold needed to win. Efficiency gap = (Party A wasted − Party B wasted) / total votes.
Pass condition: `abs(efficiency_gap) <= max_gap`. Uses the existing vote share + population
simulation already in `evaluate.ts`.

**mean_median** (`max_diff: number`)
Mean-median difference = mean district vote share − median district vote share (for one
party). Pass condition: `abs(mean − median) <= max_diff`. Computed across all districts
using the simulated partisan vote share per district.

## Goals / Acceptance Criteria

- [ ] `majority_minority` evaluator implemented; criterion config specifies `min_eligible_share`
      and `group_ids` (list of demographic group IDs to count)
- [ ] `efficiency_gap` evaluator implemented; config specifies `max_gap` (fraction, e.g. 0.08)
- [ ] `mean_median` evaluator implemented; config specifies `max_diff` (fraction, e.g. 0.05)
- [ ] All three produce a human-readable `detail` string on both pass and fail
- [ ] `tutorial-002.json` criteria updated if any currently use these types (currently none do)
- [ ] No regression in existing passing criteria (population_balance, seat_count, etc.)

## Test Coverage

- [ ] Unit tests for each evaluator: happy path (passes), boundary case (exactly at threshold),
      fail case (exceeds threshold)
- [ ] Unit tests use synthetic precinct + assignment data — no JSON fixture dependency
- [ ] Tests run via existing `js_test` harness in `web/simulation/`

## References

- `game/web/src/simulation/evaluate.ts` — evaluateCriteria, criterion type switch
- `game/web/src/model/scenario.ts` — Criterion type definitions
- `game/web/src/model/types.ts` — Precinct demographic_groups structure
- Election sim ADR: `thoughts/shared/decisions/2026-04-24-election-simulation-architecture.compressed.md`
- Game vision §SCENARIOS: efficiency_gap mentioned for scenario 3; majority_minority for scenario 5
