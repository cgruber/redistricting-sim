---
id: GAME-077
title: Tutorial-002 guided mode — advanced feature walkthrough
area: game, UX, tutorial
status: open
created: 2026-05-18
---

## Summary

Extend the tutorial overlay engine (GAME-076) to tutorial-002 with a step script covering
advanced features: the criteria panel, demographic filters, and navigating toward goal
achievement on the larger 196-precinct, 4-district map. Exact step script is finalized
during implementation based on what GAME-076 delivered.

## Current State

tutorial-002 is a 196-precinct map with 3 counties and 4 districts. No in-game guidance.
Players can reach it from the Tutorial campaign but the map is significantly more complex
than tutorial-001 with no explicit goal hand-holding.

## Goals / Acceptance Criteria

- [ ] Tutorial-002 step script designed (refine during GAME-076 implementation; themes below)
- [ ] Steps cover at minimum: criteria panel walkthrough, demographic overlay toggle, goal hint
- [ ] Overlay engine from GAME-076 reused with no required modifications (extend only if needed)
- [ ] Skip / persist behavior identical to tutorial-001 (localStorage key `tutorial-tutorial-002-complete`)

### Proposed step themes

1. "This scenario has more districts and a larger map — zoom and pan with mouse/trackpad."
2. "Check the criteria panel — it tells you what your map needs to achieve." [highlight criteria list or submit-preview area]
3. "The majority_minority criterion means one district must give the minority community a real voice." [highlight criterion row]
4. "Use the demographic overlay to see where the minority community is concentrated." [highlight view toggle, pause until toggled]
5. "Try to draw District 3 to include that community." [highlight district-3 button, soft hint — not forced]
6. "When your map meets all required criteria, Submit to see your results."

## Test Coverage

- [ ] e2e: tutorial-002 overlay activates on load
- [ ] e2e: criteria panel highlight step visible and advances correctly

## References

- GAME-076 — overlay engine (implement first)
- DESIGN-012 — overlay UX spec
- `game/public/scenarios/tutorial-002.json` — map details
- GAME-014 — scale tutorial scenario (original ticket for tutorial-002 map)
