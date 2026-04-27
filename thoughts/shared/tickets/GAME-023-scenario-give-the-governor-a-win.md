---
id: GAME-023
title: "Scenario 2: Give the Governor a Win"
area: game, content
status: open
created: 2026-04-26
---

## Summary

Author and wire in scenario 2: "Give the Governor a Win". The player is cast as a
party operative tasked with drawing a map that gives the governor's party at least one
more seat than a neutral map would produce. Teaches basic partisan gerrymandering —
that district boundaries directly control which party wins seats, even with the same
underlying votes.

Lesson: basic partisan gerrymandering; line-drawing as seat allocation.
Character framing: party operative / campaign strategist for the governor's party.
Fictional region: new (not tutorial-002's Millbrook area); small enough to be approachable.

## Current State

No scenario 2 JSON exists. The manifest (once GAME-021 is done) will have a placeholder
or this ticket blocks on GAME-021.

## Goals / Acceptance Criteria

- [ ] `game/scenarios/scenario-002.json` authored with:
      - 80–120 precincts (step up from tutorial-002's introductory scale)
      - 4–5 districts
      - Partisan vote share data where a neutral map splits seats evenly but
        a gerrymander gives the governor's party a majority
      - Intro narrative: character, role, 2 slides, objective text
      - Required criteria: `seat_count` for governor's party ≥ target
      - Optional criteria: population balance within tighter tolerance (achievement)
      - `population_tolerance: 0.10`; contiguity required
- [ ] Scenario is winnable — a valid assignment exists that satisfies all required criteria
- [ ] Scenario is wired into `SCENARIO_MANIFEST` (depends on GAME-021)
- [ ] Select screen shows scenario 2 card, locked until tutorial-002 completed
- [ ] E2e smoke test: scenario loads, intro shows correct character name and objective,
      map renders correct precinct count
- [ ] Winnability e2e test: paints a known-valid solution, submits, asserts "Map Passed!"

## Design Notes

- Neutral split should be 2–2 or 2–3; gerrymandered target should be 3–2 or 4–1
- Partisan lean should be genuinely competitive (neither party has a blowout majority)
  so that line-drawing is what determines the outcome, not raw vote totals
- Keep the map shape simple (rectangular-ish region); complexity comes from the puzzle,
  not from irregular geography
- Consider a river or other geographic feature as flavor

## References

- Game vision §SCENARIOS row 2: "Give the Governor a Win — basic partisan gerrymandering"
- `game/scenarios/tutorial-002.json` — reference for JSON format
- `thoughts/shared/decisions/2026-04-24-scenario-data-format.compressed.md`
- Depends on: GAME-021 (manifest), GAME-022 (evaluators, if seat_count needs updating)
