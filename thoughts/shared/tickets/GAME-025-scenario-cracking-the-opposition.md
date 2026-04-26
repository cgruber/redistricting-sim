---
id: GAME-025
title: "Scenario 4: Cracking the Opposition"
area: game, content
status: open
created: 2026-04-26
---

## Summary

Author and wire in scenario 4: "Cracking the Opposition". The player draws a map that
dilutes the opposition's vote by splitting their geographic strongholds across multiple
districts, preventing them from winning any. Together with scenario 3 (packing), this
completes the pack-and-crack pattern — the two tactics are most powerful in combination.
Teaches cracking as a tactic and sets up the mean-median difference as a measure.

Lesson: cracking tactic; how splitting a voting bloc across districts neutralises it;
pack-and-crack as combined strategy.
Character framing: incumbent party operative defending existing seat margins.
Fictional region: new region; linear or elongated geography where an opposition strip
runs through the middle, making it natural to crack by drawing vertical district lines.

## Current State

No scenario 4 JSON exists. Depends on GAME-022 for `mean_median` evaluator.

## Goals / Acceptance Criteria

- [ ] `game/scenarios/scenario-004.json` authored with:
      - 100–150 precincts
      - 4–5 districts
      - Geography where opposition vote is concentrated in a band or corridor that
        can be split by creative district lines
      - Intro narrative: character, role, 2–3 slides; explains cracking concept
      - Required criteria: `seat_count` — opposition wins zero or one district
      - Optional criteria: `mean_median` within threshold (achievement — "textbook crack")
      - `population_tolerance: 0.10`; contiguity required
- [ ] Scenario is winnable — valid cracking solution exists for required criteria
- [ ] Wired into `SCENARIO_MANIFEST` after scenario 3; unlocks after scenario 3 completed
- [ ] E2e smoke test: scenario loads, intro correct, precinct count correct
- [ ] Winnability e2e test: known-valid solution submits and passes

## Design Notes

- The intro should explicitly name pack-and-crack and reference scenario 3 ("last time you
  packed — this time you crack"), building on prior learning
- The geography should make cracking feel intuitive: a linear opposition corridor that
  the player can divide by drawing district lines perpendicular to it
- The "aha" moment: player sees that winning 80% of votes in a district is wasteful —
  the same votes spread across three districts wins none of them
- mean_median optional criterion: completing it rewards players who achieve a "clean"
  crack with a statistically lopsided result

## References

- Game vision §SCENARIOS row 4: "Cracking the Opposition — cracking tactic"
- GAME-022: mean_median evaluator (required before this criterion can be used)
- GAME-024: scenario 3 (must be complete before scenario 4 is wired in sequence)
- `thoughts/shared/decisions/2026-04-24-scenario-data-format.compressed.md`
