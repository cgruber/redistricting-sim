---
id: GAME-077
title: Tutorial-002 "The Map & the Views" — terrain + lean/county/city views (guided)
area: game, UX, tutorial, content
status: open
created: 2026-05-18
---

## Summary

Author tutorial-002 as the second guided walkthrough: a slightly bigger map with
**terrain features** that introduces the right-side **View toolbar** — lean, county, and
city views — revealing each in sequence as it's taught. Reuses the overlay engine from
GAME-076. Teaches **how to read the map**, a game mechanic; it is *not* an electoral
strategy lesson.

Supersedes the original "advanced feature walkthrough / majority_minority goal
orientation" framing — that was electoral; the redesign keeps tutorials to game mechanics.
See plan: `thoughts/shared/plans/2026-06-24-tutorial-redesign-pipeline-migration.md`.

## Approach — design locked with user

- **Map (pipeline):** `map.shape: hex_circle`, `radius: 4` → **61 precincts**, **3 districts**.
- **Terrain (cosmetic):** a river + a coastline on one edge. Purely visual — never blocks
  contiguity (project rule: geography is cosmetic by default).
- **Content for the views:** partisan **lean** present (a simple east/west split, so the
  Lean view shows something) but **no `seat_count` criterion** — the player learns to
  *read* lean, not exploit it. **2–3 counties** + **one urban core** so County and City
  (GAME-096) views have boundaries to draw.
- **Unlock model = reveal-within-T2 only:** the View toolbar starts showing only
  Districts; the tutorial reveals + teaches Lean, then County, then City, one at a time.
  In real (non-tutorial) scenarios all views remain always available — no cross-scenario
  gating. Reveal is non-destructive (CSS/state-only), like the highlight mechanism.
- **Objective stays mechanical:** paint 3 balanced, contiguous districts and submit. The
  views are tools introduced, not a puzzle requirement. Criteria: `district_count`
  (required) + `population_balance` (required) + `compactness` (optional).

## Proposed step script (finalize during implementation, against current toolbar)

| Step | Text (gist) | Highlight / action | Advance |
|------|-------------|--------------------|---------|
| 1 | "Bigger map this time — and it has geography. That blue line is a river; this edge is coastline. They're scenery; districts can cross them." | river + coast precincts | auto / next |
| 2 | "The map can show more than districts. Here's **Lean** — who each precinct leans toward." | reveal + highlight Lean radio | click-target |
| 3 | "**County** borders show the old administrative lines." | reveal + highlight County toggle | click-target |
| 4 | "**City limits** show where the city is." | reveal + highlight City toggle (GAME-096) | click-target |
| 5 | "Now you've got the full view set. Draw 3 balanced districts and submit." | Paint toolbar + submit | condition: submitted |

## Goals / Acceptance Criteria

- [ ] `tutorial-002.spec.yaml` authored to the locked design; `tutorial-002.json` generated
      via the pipeline (lean split, 2–3 counties, urban core, river + coast terrain).
- [ ] Reuses GAME-076 overlay engine; no engine fork.
- [ ] Engine supports a **reveal-target** step action (show/enable a toolbar control that
      began hidden), tutorial-local only; real scenarios unaffected.
- [ ] Step script teaches terrain recognition + lean/county/city in sequence.
- [ ] Objective is mechanical (3 balanced contiguous districts); no electoral criterion.
- [ ] Skip / persist identical to tutorial-001 (`tutorial-tutorial-002-complete`).
- [ ] e2e: tutorial-002 reveals each view as its step fires; winnable by painting 3
      balanced contiguous districts; views are present/unlocked in a normal scenario.

## References

- Plan: `thoughts/shared/plans/2026-06-24-tutorial-redesign-pipeline-migration.md`.
- GAME-076 — overlay engine (this reuses it); DESIGN-012 — overlay UX spec (reveal action).
- GAME-096 — city-limits overlay (prerequisite for the City view step).
- GAME-097 — tutorial pipeline conventions (spec format, no-partisan path, tutorial flag).
