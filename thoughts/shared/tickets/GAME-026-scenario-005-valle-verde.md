---
id: GAME-026
title: Scenario 005 — Valle Verde: A Voice for the Valley
area: game, content
status: resolved
created: 2026-04-26
---

## Summary

Add scenario-005 ("Valle Verde: A Voice for the Valley") — the VRA/majority-minority
district lesson. The Valley's Latino community has been cracked across five districts;
the player must consolidate them into one majority-Latino district to comply with Section
2 of the Voting Rights Act.

## Current State

Generator script (`gen-scenario-005.main.kts`) written and executed; `scenario-005.json`
produced. `SCENARIO_MANIFEST` in `main.ts` updated. JSON copied to `_serve_dist/scenarios/`.
Needs build verification, e2e coverage, and PR merge.

## Goals / Acceptance Criteria

- [x] `game/scenarios/gen-scenario-005.main.kts` generates `scenario-005.json`
- [x] `scenario-005.json` is in `game/scenarios/` and `game/_serve_dist/scenarios/`
- [x] `scenario-005` is in `SCENARIO_MANIFEST` in `main.ts`
- [x] Scenario loads without loader validation errors (all invariants pass)
- [x] Scenario appears in select screen with correct title
- [x] Initial state: all five districts fail majority_minority criterion (no district ≥ 50% Latino)
- [x] Winning state: consolidating the valley (q=3..8, r=5..8) into one district → criterion passes
- [x] Intro slides render (three slides: "The Valley Grows", "The Voting Rights Act", "A Tradeoff You'll See")
- [x] `majority_minority` criterion uses `group_filter: { dimension: "ethnicity", value: "latino" }`
- [x] Population balance criterion passes for a valid consolidated map
- [x] `bazel build //web/...` clean from `game/`
- [x] `bazel test //web:e2e_test` passes (all existing tests + new)

## Test Coverage

- [x] e2e: scenario-005 smoke — 120 precincts render after intro skip
- [x] e2e: intro shows "Redistricting Coordinator" role and "majority-Latino district" objective
- [x] e2e: winnability — paintStroke assigns valley (q=3-8, r=5-8) to D3; submit → "Map Passed!"
- NOTE: select-screen appearance and initial-state failure covered by GAME-021 test infra and loader invariants; not separately tested here

## Scenario Design Notes

- 120 precincts: 10 columns (q=0..9) × 12 rows (r=0..11); 5 districts of 24
- Valley zone: q=3..8, r=5..8 = 24 precincts; ~70% Latino
- Rim: everything else; ~20% Latino
- Initial assignment: vertical 2-column strips → D2–D5 each get some valley, none reach 50% Latino
- Winning solution: all valley precincts into one district → ~70% Latino → passes
- group_schema: `{ "ethnicity": ["latino", "anglo"] }` — two groups per precinct
- Educational bonus: VRA compliance packs Ken votes, making other four districts more Ryu-leaning

## References

- `game/scenarios/gen-scenario-005.main.kts` — generator script
- `game/scenarios/scenario-005.json` — generated scenario
- `game/web/src/main.ts` — SCENARIO_MANIFEST (line ~40)
- `game/web/src/model/loader.ts` — invariant 7 (group_schema cartesian product check)
- `game/web/src/simulation/evaluate.ts` — majority_minority evaluator
- GAME-022 — majority_minority evaluator implementation
