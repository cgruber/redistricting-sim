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

- [ ] Sequential reveal: criteria revealed one at a time (400ms stagger), not simultaneously
- [ ] Each criterion holds in "CHECKING…" badge state (1 200ms) with opacity-pulse before
      flipping to PASS/FAIL (150ms pop); per DESIGN-010 §D2_TIMING
- [ ] Per-criterion icon (`criterion-icons.ts`) replaces ✓/✗ text; one SVG per criterion
      type; grey during CHECKING, color-tinted (green/red) on result; per DESIGN-010 §D1_ICONS
- [ ] Instigator renders in neutral/waiting pose before criteria begin; transitions to
      binary approve (stars ≥ 1) or disapprove (stars === 0) 0.8s after last row resolves;
      0.4s cross-fade; foot-baseline pinned via CSS so it reads as posture change not jump;
      per DESIGN-010 §D3_CHARACTER_FLASH
- [ ] Click-to-skip still works: clears all pending timeouts, instantly resolves all rows
      to final state, shows instigator in final pose
- [ ] `prefers-reduced-motion`: JS branch skips sequential reveal entirely; all rows
      rendered in final state immediately; instigator shown in final pose at open
- [ ] Audio: `audioPlayer.play("instigator-approve-{type}")` / `"instigator-disapprove-{type}"`
      on instigator flip; graceful no-op until GAME-061 clips registered

## Test Coverage

- [ ] e2e: in reduced-motion mode, all rows visible immediately after submit
- [ ] e2e: clicking result screen during CHECKING hold reveals remaining rows instantly
- [ ] e2e: result screen shows criterion icons (SVG elements in `.rc-icon`)

## References

- `thoughts/shared/tickets/DESIGN-010-result-screen-dramatic-reveal.md` — **blocks this**
- `thoughts/shared/tickets/GAME-062-character-reaction-system.md` — character sprite foundation
- `thoughts/shared/tickets/GAME-061-audio-clips.md` — drum-roll audio (optional dep)
- `game/web/src/main.ts` — `showResultScreen()`, criterion reveal loop
- `game/web/styles.css` — `@keyframes criterionReveal`, `.result-criterion`
