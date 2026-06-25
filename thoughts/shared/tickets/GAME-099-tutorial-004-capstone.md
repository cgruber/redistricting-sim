---
id: GAME-099
title: Tutorial-004 "Capstone" — full map, all tools, bridge to electoral scenarios
area: game, UX, tutorial, content
status: resolved
created: 2026-06-24
---

## Summary

Author tutorial-004, the capstone: a fuller map with **every tool available from the start**
(nothing hidden, no `reveal`) where the player puts together everything from T1–T3 — paint a
legal map, read the lean + result — as the bridge into the real electoral scenarios. A light
guided script orients ("everything you've learned, one map") then steps back.

Detailed pedagogy refined when reached. See the arc in
`thoughts/shared/plans/2026-06-24-tutorial-redesign-pipeline-migration.md` and DESIGN-012.

## Approach (to refine)

- **Map:** bigger / more districts than T3; terrain, lean, counties, city — the full set.
- **Flags:** `guided: true`; nothing hidden (all panels/views visible from load).
- **Objective:** likely the first to nudge toward *using* the result (a soft electoral goal),
  or kept mechanical as a pure "draw a complete, legal map" — decide when authoring.
- **Script:** short — orient + a couple of reminders, then free play.

## Goals / Acceptance Criteria

- [x] Pedagogy + objective finalized — the full legal-map skill (gates district_count +
      **population_balance** + contiguity); result visible to read, no seat goal.
- [x] `tutorial-004.spec.yaml` authored; `tutorial-004.json` generated (127 precincts, 4 districts).
- [x] Light guided script (orient → paint → submit); reuses GAME-076 engine (no fork).
- [x] Campaign wiring: tutorial-004 added to the tutorial campaign + SCENARIO_MANIFEST, in order.
- [x] e2e: loads (127), all chrome visible, winnable (4 balanced wedges, BFS-verified), + overlay.

## Resolution (2026-06-25) — shipped

Shipped: "Fairhaven: Putting It Together" — a radius-6 (127-precinct) 4-district map with a
river, east/west lean (west 60% / east 40% Ken), and three counties. `guided: true`, **nothing
hidden** (`hide_election_results: false`, `hide_view_toolbar: false`, no `reveal`) — every tool
visible from load. Light 3-step `TUTORIAL_004` script (orient → paint → submit). Wired into the
tutorial campaign (now 4 scenarios) + SCENARIO_MANIFEST; wrap-up + campaign-select + campaigns
tests updated.

Initial draft (#280) gated district_count + contiguity only; the owner asked to keep **balance**
gated, noting the player fixes the districts (no simple stripe needed). Follow-up: re-added the
`population_balance` criterion (±15%). The winning move is **four wedges around the centre** —
each district gets an equal slice of the dense core + sparse rim, landing all four within ±15%
(BFS-verified balanced + contiguous; a 45° rotation gives the best margin). e2e winnability +
wrap-up carve those wedges.

**Remaining judgment calls / deferrals:**
- **Objective kept mechanical** (no seat goal) — winning by seats was never taught; that's the
  campaign scenarios. The result is the bridge, shown to read.
- **City view** deferred — needs GAME-096; the map carries an urban core for when it ships.
- **Coastline** deferred to the owner's precinct picks (a sea tile can sit on a rim hex-edge, not
  only fully outside the circle).

## References

- Plan + DESIGN-012. GAME-076 — engine. GAME-098 — tutorial-003 (precedes this).
