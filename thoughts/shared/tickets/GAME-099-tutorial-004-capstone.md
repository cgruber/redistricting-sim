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

- [x] Pedagogy + objective finalized — **mechanical** (gates district_count + contiguity; result
      visible to read, no seat goal). See Resolution for the balance-gate judgment.
- [x] `tutorial-004.spec.yaml` authored; `tutorial-004.json` generated (127 precincts, 4 districts).
- [x] Light guided script (orient → paint → submit); reuses GAME-076 engine (no fork).
- [x] Campaign wiring: tutorial-004 added to the tutorial campaign + SCENARIO_MANIFEST, in order.
- [x] e2e: loads (127), all chrome visible, winnable (4 contiguous diagonal strips), + overlay.

## Resolution (2026-06-25) — DRAFT shipped

Shipped: "Fairhaven: Putting It Together" — a radius-6 (127-precinct) 4-district map with a
river, east/west lean (west 60% / east 40% Ken), and three counties. `guided: true`, **nothing
hidden** (`hide_election_results: false`, `hide_view_toolbar: false`, no `reveal`) — every tool
visible from load. Light 3-step `TUTORIAL_004` script (orient → paint → submit). Wired into the
tutorial campaign (now 4 scenarios) + SCENARIO_MANIFEST; wrap-up + campaign-select + campaigns
tests updated.

**Judgment calls (flagged for review):**
- **Balance is NOT gated** (district_count + contiguity only). A hex circle with 4 districts has
  no clean balanced band/strip partition (the centre diagonal alone is ~11% of population), and
  the initial-assignment rule can only express diagonal strips — so gating balance would make the
  map unwinnable-by-a-simple-move. The Map Validity panel stays **visible** (the player practises
  + sees balance), but the gate is light to keep the capstone low-pressure + winnable. Revisit if
  a balanced 4-partition becomes expressible, or drop to 3 districts.
- **Objective kept mechanical** (no seat goal) — winning by seats was never taught; that's the
  campaign scenarios. The result is the bridge, shown to read.
- **City view + coastline deferred** (same as T3): City needs GAME-096; the coast needs
  outer-ring sea tiles (visual pass). The map carries an urban core for the City view later.

## References

- Plan + DESIGN-012. GAME-076 — engine. GAME-098 — tutorial-003 (precedes this).
