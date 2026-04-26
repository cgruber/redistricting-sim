---
id: GAME-019
title: "tutorial-002 winnability: verify solvable, adjust if needed, e2e test that solves the map"
area: game, content, testing
status: open
created: 2026-04-26
---

## Summary

tutorial-002 (196-precinct three-county scenario) is the live scenario but has never been
playtested to confirm it is actually winnable. The initial district assignment is badly
skewed (d1: 174k, d2: 289k, d3: 150k vs. ~204k target), which is intentional — but it is
unknown whether a valid solution (all districts contiguous, population within ±10%) is
reachable through normal play. The existing e2e submit test bypasses the validity gate by
force-enabling the button in JavaScript rather than legitimately solving the map.

This ticket covers: (1) verifying tutorial-002 is winnable, adjusting the scenario JSON if
not; (2) writing an e2e test that actually paints precincts until the submit button enables
naturally, then submits and asserts a pass result.

## Current State

- `tutorial-002.json`: 196 precincts, 3 districts, population_tolerance 0.1, contiguity required
- Initial populations: d1=174,473 d2=289,254 d3=149,517 (target ≈204,408 each)
- Existing e2e test in `sprint3.spec.ts` force-enables the submit button to test the result
  screen structure — it does not validate that the map can be legitimately solved
- No human or automated test has confirmed a winning configuration exists

## Goals / Acceptance Criteria

- [ ] Play through tutorial-002 manually (via `serve.sh`) and find a valid winning assignment
- [ ] If no valid solution is reachable (contiguity + population balance simultaneously
      satisfiable), adjust precinct `initial_district_id` assignments or `total_population`
      values in tutorial-002.json until a solution exists
- [ ] Write an e2e test (in `sprint3.spec.ts` or a new `e2e/winnability.spec.ts`) that:
      - Paints precincts by clicking/dragging until the submit button is naturally enabled
        (no JS force-enable)
      - Clicks submit
      - Asserts `#result-verdict` contains "Map Passed!"
      - Asserts all required criteria show PASS badges
- [ ] The winning paint sequence must be deterministic and reproducible (hardcoded precinct
      IDs or a fixed paint path, not random)
- [ ] All existing e2e tests continue to pass

## Test Coverage

The new e2e test IS the primary deliverable. It proves the game can be won, not just that
the result screen renders.

## References

- Scenario file: `game/scenarios/tutorial-002.json`
- Existing submit tests: `game/web/e2e/sprint3.spec.ts` (GAME-017 section)
- Criteria evaluators: `game/web/src/simulation/evaluate.ts`
- Validity gate: `game/web/src/simulation/evaluate.ts` `isMapSubmittable()`
