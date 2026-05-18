---
id: GAME-072
title: "Neutral/meh audio clip for optional criteria that fail"
area: game, audio
status: open
created: 2026-05-18
---

## Summary

When an optional criterion fails, the current audio plays the `party-disapprove` clip
(a crowd boo / strong negative reaction). This is too strong — an optional criterion
failing is a mild disappointment, not a failure. A shorter "meh", "eh", or soft-neutral
clip would better match the emotional weight of missing a bonus criterion.

## Current State

- Audio selection (`finalizeRow` in `main.ts`): `else { clipName = passed ? "party-approve" : "party-disapprove"; }`
- `party-disapprove` is itself a stub (GAME-071 fine-tuning pending)
- No "neutral/meh" clip exists in the asset inventory

## Goals / Acceptance Criteria

- [ ] New audio clip: short neutral/unenthusiastic reaction (~0.5–1.5s, −16 LUFS), labelled
      `neutral-meh` or similar in INVENTORY.md
- [ ] Optional-fail rows play the neutral clip instead of `party-disapprove`
- [ ] Optional-pass rows continue to use `party-approve` (or a per-type clip if GAME-071 is done)
- [ ] Clip produced and levelled consistent with existing assets

## Test Coverage

- [ ] e2e: optional-fail row triggers a `play()` call with the neutral clip name
      (verify via a test hook or spy, or assert silence vs. strong boo subjectively in manual test)

## References

- `game/web/src/main.ts` — `finalizeRow()` audio selection block
- `game/web/assets/audio/INVENTORY.md` — audio clip registry
- `thoughts/shared/tickets/GAME-071-audio-character-assignment.md` — related audio fine-tuning
