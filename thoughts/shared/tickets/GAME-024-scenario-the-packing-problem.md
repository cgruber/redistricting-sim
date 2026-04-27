---
id: GAME-024
title: "Scenario 3: The Packing Problem"
area: game, content
status: open
created: 2026-04-26
---

## Summary

Author and wire in scenario 3: "The Packing Problem". The player is cast as a map drawer
who must concentrate ("pack") the opposition party into as few districts as possible,
maximising wasted votes and producing an outsized seat advantage. Teaches packing as a
gerrymandering tactic and introduces the efficiency gap as a way to measure it.

Lesson: packing tactic; wasted votes; efficiency gap as a fairness metric.
Character framing: redistricting consultant hired by the majority party.
Fictional region: new region; slightly larger than scenario 2; urban/suburban mix to
make packing interesting (high-density opposition precincts that are tempting to pack).

## Current State

No scenario 3 JSON exists. Depends on GAME-022 for `efficiency_gap` evaluator.

## Goals / Acceptance Criteria

- [ ] `game/scenarios/scenario-003.json` authored with:
      - 100–150 precincts
      - 4–5 districts
      - Population distribution with a clear high-density "opposition core" area
        that makes packing a natural move
      - Intro narrative: character, role, 2–3 slides, objective text explaining packing
      - Required criteria: `seat_count` for player's party ≥ target seats
      - Optional criteria: `efficiency_gap` below threshold (achievement — "efficient gerrymander")
      - `population_tolerance: 0.10`; contiguity required
- [ ] Scenario is winnable — valid packing solution exists for required criteria
- [ ] Wired into `SCENARIO_MANIFEST` after scenario 2; unlocks after scenario 2 completed
- [ ] E2e smoke test: scenario loads, intro correct, precinct count correct
- [ ] Winnability e2e test: known-valid solution submits and passes

## Design Notes

- The optional efficiency_gap criterion is an achievement — players who pack aggressively
  enough hit it; casual solutions don't need to
- The intro slides should explain what packing is before the player starts, so the
  player understands the tactic they're about to use
- Consider 2 slides: slide 1 = political context/character; slide 2 = what packing means
  and why it works
- The "aha" moment: player realises concentrating losses is the mirror of concentrating wins

## References

- Game vision §SCENARIOS row 3: "The Packing Problem — packing; efficiency gap"
- GAME-022: efficiency_gap evaluator (required before this criterion can be used)
- GAME-023: scenario 2 (must be complete before scenario 3 is wired in sequence)
- `thoughts/shared/decisions/2026-04-24-scenario-data-format.compressed.md`
