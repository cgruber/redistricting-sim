---
id: GAME-066
title: Result screen dramatic reveal — per-criterion icons, suspense pause, character flash
area: game, UX
status: open
created: 2026-05-07
---

## Summary

Implement the dramatic reveal sequence designed in DESIGN-010: each criterion
row pauses ~3 seconds with a "pending" animation before flipping to pass/fail,
shows a type-appropriate icon, and the instigator character flashes from neutral
to approve/disapprove at the moment of reveal. Replaces the current uniform
stagger animation with a sequential, tension-building flow. Depends on DESIGN-010
for icon spec and timing decisions.

## Current State

- Criteria animate in with 120ms stagger, all simultaneously started — GAME-052
- Instigator character (governor for scenario-002) shown once in final pose — GAME-062
- No per-criterion icons (✓/✗ text only); no suspense pause; no character flash

## Goals / Acceptance Criteria

- [ ] Sequential reveal: criteria revealed one at a time, not stagger-simultaneously
- [ ] Each criterion holds in "pending" state (~3s, or skip-able) before showing
      pass/fail verdict
- [ ] Per-criterion icon replaces the bare ✓/✗ text, per DESIGN-010 spec:
      - district_count: checkmark icon
      - population_balance: scales icon
      - seat_count: instigator-specific (governor flashes neutral→approve/disapprove)
      - compactness: achievement badge
      - validity rows: warning icon
- [ ] Instigator character flashes from neutral pose to reaction pose when its
      associated criterion reveals; stays in final-verdict pose after all done
- [ ] Click-to-skip still works: skips pending state, reveals all remaining
      criteria instantly (no animation)
- [ ] `prefers-reduced-motion`: all pending + flash animations suppressed; criteria
      reveal instantly; character shown in final pose without transition
- [ ] Audio: drum-roll or suspense sound during pending state, if GAME-061 audio
      clips are available; graceful no-op if absent

## Test Coverage

- [ ] e2e: after submit, criteria rows appear sequentially (first visible, others hidden)
- [ ] e2e: clicking result screen during pending state reveals remaining rows instantly
- [ ] e2e: `prefers-reduced-motion` — all rows visible immediately after submit

## References

- `thoughts/shared/tickets/DESIGN-010-result-screen-dramatic-reveal.md` — **blocks this**
- `thoughts/shared/tickets/GAME-062-character-reaction-system.md` — character sprite foundation
- `thoughts/shared/tickets/GAME-061-audio-clips.md` — drum-roll audio (optional dep)
- `game/web/src/main.ts` — `showResultScreen()`, criterion reveal loop
- `game/web/styles.css` — `@keyframes criterionReveal`, `.result-criterion`
