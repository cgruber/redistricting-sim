---
id: GAME-099
title: Tutorial-004 "Capstone" — full map, all tools, bridge to electoral scenarios
area: game, UX, tutorial, content
status: open
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

- [ ] Pedagogy + objective finalized (mechanical vs first soft electoral goal).
- [ ] `tutorial-004.spec.yaml` authored; `tutorial-004.json` generated.
- [ ] Light guided script (orient → free play); reuses GAME-076 engine.
- [ ] Campaign wiring: tutorial-004 added to the tutorial campaign list, in order.
- [ ] e2e: loads, all chrome visible, winnable.

## References

- Plan + DESIGN-012. GAME-076 — engine. GAME-098 — tutorial-003 (precedes this).
