---
id: GAME-003
title: Author tutorial scenario JSON (scenario 1)
area: game, content
status: resolved
created: 2026-04-25
---

## Summary

Create the first playable scenario: the tutorial. This is the primary demo target
for Sprint 1 and the scenario players experience first. It must teach basic
redistricting mechanics without assuming prior knowledge.

The implementing agent must produce a written **sketch/proposal** before authoring
the full JSON. The proposal should be reviewed before the full data is written,
since the fictional world choices affect all future scenarios.

## Current State

No scenario files exist. The fictional world (state name, region, parties, characters)
has not been decided. These decisions are intentionally left to the authoring agent —
the game vision provides design constraints but not specific creative choices.

## Goals / Acceptance Criteria

**Phase 1 — Proposal (produce first, before Phase 2):**
- [x] Written sketch covering:
  - Fictional state name and region/county name
  - Two fictional party names and abbreviations (not Red/Blue — something more fun)
  - Player character: name, role, motivation (low-stakes, tutorial framing)
  - Intro slide text (1–2 slides)
  - Objective text shown on map screen
  - Map shape: ~30 hex precincts in axial coordinates, rough layout sketch
  - District count (2) and rough intended split
  - Success criteria (at minimum: `district_count` + `population_balance`)
  - Lesson taught: how redistricting works; no partisan angle

**Phase 2 — Full JSON authoring (after proposal reviewed):**
- [x] Valid scenario JSON file at `game/scenarios/tutorial-001.json`
- [x] Passes `loadScenario()` validator (GAME-002) with no errors
- [x] `format_version: "1"`; `election_type: "state_house"`
- [x] ~30 hex precincts in axial coordinates; all editable; no context precincts needed
- [x] Demographic groups: at minimum 2 groups per precinct; `vote_shares` sum to 1.0
  for all parties; `population_share` sum to 1.0 per precinct
- [x] Both districts populated plausibly when auto-fill applied (not all precincts
  in one corner)
- [x] `initial_district_id: null` on all precincts (player draws from scratch)
- [x] No events (tutorial is baseline only)
- [x] 2 required success criteria: `district_count` + `population_balance`
- [x] Optional criterion: at least 1 (e.g. rough partisan balance or compactness)
- [x] Narrative: character framing, 1–2 intro slides, map objective text

## Design Constraints (from game vision)

- Fictional parties — NOT "Red Party" / "Blue Party" as defaults; pick something
  with personality (see §SCENARIOS — "Cats vs Dogs" is a later scenario, so avoid
  animal parties here; use something civic-flavored)
- Tutorial lesson: redistricting exists; you draw lines; lines affect outcomes
- No partisan gotcha in tutorial — success should be achievable many ways
- Character should have low-stakes, relatable motivation ("just trying to do the job")

## References

- Game vision: `thoughts/shared/vision/game-vision.compressed.md` §SCENARIOS, §SCENARIO_INTRO, §LOOP
- Spec: `thoughts/shared/decisions/2026-04-24-scenario-data-format.md`
- Loader (validates the result): GAME-002
