---
id: GAME-014
title: Scale tutorial scenario to prove out UI features
area: game, content
status: open
created: 2026-04-26
github_issue: 78
---

## Summary

The current tutorial scenario (Kalanoa/Westford) has only 30 precincts in a single county. At this scale, pan/zoom is barely useful, county border overlay has nothing to show, and the validity panel has too little variation to be interesting. For Sprint 3 we need a scenario large enough that all Sprint 2 UI features have something meaningful to exercise.

## Current State

`game/scenarios/kalanoa_westford.json` — 30 precincts, 2 districts, single county. Generated procedurally. Adequate for unit testing; inadequate for feature demonstration.

## Goals / Acceptance Criteria

- [ ] At least one scenario with 150–300 precincts (enough to require pan/zoom to navigate)
- [ ] At least 3 counties represented (so county border overlay shows visible borders between them)
- [ ] At least 3 districts (so validity panel has meaningful per-district comparisons)
- [ ] Realistic-feeling population distribution (precincts vary in size, not uniform grid)
- [ ] Scenario passes all `loadScenario` validation invariants (existing unit tests cover this)
- [ ] Existing 30-precinct scenario retained for fast unit-test runs
- [ ] New scenario loads and renders in the browser without visible lag

## Test Coverage

- [ ] Unit: new scenario passes `bazel test //web/src/model:loader_test` (existing validator covers all invariants)
- [ ] e2e: app loads with new scenario; `path.hex` count matches expected precinct count
- [ ] Manual: county borders visible after clicking "Show County Borders"; pan/zoom required to see full map

## References

- Raised during Sprint 2 demo review (2026-04-26)
- `game/scenarios/kalanoa_westford.json` — current 30-precinct scenario
- `thoughts/shared/tickets/GAME-003-author-tutorial-scenario.md` — original scenario authoring ticket (resolved)
- `game/web/src/model/loader_test.ts` — invariant tests that new scenario must pass
