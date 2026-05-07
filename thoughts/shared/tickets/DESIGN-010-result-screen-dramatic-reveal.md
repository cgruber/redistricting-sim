---
id: DESIGN-010
title: Result screen dramatic reveal — per-criterion icons, suspense timing, character flash
area: design, UX, art
status: resolved
created: 2026-05-07
resolved: 2026-05-07
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

- [x] Per-criterion icon spec decided: separate flat SVG set (24 or 36px, try both);
      inline in `criterion-icons.ts`; one icon per criterion type; full mapping in research doc
- [x] Suspense timing spec decided: 400ms stagger (tentative); 1 200ms CHECKING hold
      with pulsing badge; 150ms flip to PASS/FAIL; click-to-skip
- [x] Character flash behavior spec decided: no per-criterion flash; instigator holds
      new `waiting.svg` neutral pose pre-reveal; binary approve (1–3 stars) or
      disapprove (0 stars) after 0.8s pause; 0.4s cross-fade; foot-anchored CSS
- [x] Icon placement spec: inside `.rc-icon` slot, replacing ✓/✗; color-tinted on result
- [x] Relationship to DESIGN-009 clarified: separate icon set; not derived from character
      sprites; same dark-bg aesthetic but different scale and purpose
- [x] Decisions documented in `thoughts/shared/research/2026-05-07-design-010-result-screen-dramatic-reveal.md`

## References

- `thoughts/shared/tickets/GAME-062-character-reaction-system.md` — partial impl; gates GAME-066
- `thoughts/shared/tickets/GAME-066-result-screen-dramatic-reveal-impl.md` — implements this
- `thoughts/shared/research/2026-05-02-design-009-character-reaction-visual-style.md` — prior style decisions
- `game/web/src/main.ts` — `showResultScreen()` + criterion reveal loop
- `game/web/styles.css` — `.result-criterion`, `@keyframes criterionReveal`
