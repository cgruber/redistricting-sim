---
id: DESIGN-010
title: Result screen dramatic reveal — per-criterion icons, suspense timing, character flash
area: design, UX, art
status: open
created: 2026-05-07
---

## Summary

Redesign the result screen reveal sequence to build tension and make each criterion
outcome feel meaningful. Currently, criteria animate in with a stagger but no
suspense. The goal: each criterion has a type-appropriate icon, a ~3-second
"evaluating" hold before the verdict flips, and the instigator character reacts
per-criterion (flashing from neutral to approve/disapprove) rather than showing a
single final pose. This ticket is design research — decisions here gate GAME-066
(implementation).

## Current State

- Criteria reveal with a 120ms stagger animation (opacity + translateY) — GAME-052
- Instigator character shown in final pose after all criteria — partial GAME-062
- No per-criterion icons; no suspense pause; no per-criterion character flash
- `#result-reaction` holds the character sprite above the criteria list

## Goals / Acceptance Criteria

- [ ] Per-criterion icon spec decided: one icon per criterion type; sourced from
      CSS/SVG inline or character-sprite sheet; documented with rationale
      - district_count: large green ✓ checkmark
      - population_balance: scales icon (legal-requirement framing)
      - seat_count (governor's goal): governor neutral → flash approve/disapprove
      - compactness: achievement sticker / badge aesthetic (TBD)
      - other criterion types: icons TBD
- [ ] Suspense timing spec decided: duration, animation style during "evaluating"
      hold (spinning indicator? pulsing "…"? drum-roll audio cue?), how skip works
- [ ] Character flash behavior spec decided: does the instigator flash on the
      *specific* criterion they care about, on every criterion, or only on the
      overall verdict? Pose transition animation style (instant cut vs. brief
      fade/slide)
- [ ] Icon placement spec: inside the criterion row (replacing the ✓/✗ icon),
      or as a separate panel element?
- [ ] Relationship to DESIGN-009 art spec clarified: do per-criterion icons use
      the same style as character sprites, or a separate flat/minimal icon set?
- [ ] Decisions documented in a research doc (`thoughts/shared/research/`)

## References

- `thoughts/shared/tickets/GAME-062-character-reaction-system.md` — partial impl; gates GAME-066
- `thoughts/shared/tickets/GAME-066-result-screen-dramatic-reveal-impl.md` — implements this
- `thoughts/shared/research/2026-05-02-design-009-character-reaction-visual-style.md` — prior style decisions
- `game/web/src/main.ts` — `showResultScreen()` + criterion reveal loop
- `game/web/styles.css` — `.result-criterion`, `@keyframes criterionReveal`
