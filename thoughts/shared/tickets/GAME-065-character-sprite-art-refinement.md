---
id: GAME-065
title: Character sprite art refinement — quality iteration after initial generation
area: game, art, content
status: open
created: 2026-05-04
last_updated: 2026-05-13
---

## Summary

Two-part scope:

1. **Broker initial production** (stretch): generate the 9 bipartisan-broker PNG images
   (3 demographic variants × 3 evaluation states) using `gen-assets.main.kts` and the
   spec in `tools/sprite-spec.json`. This is the initial production run for the broker;
   it is not covered by GAME-060 (which covers the per-criterion roster only).

2. **Quality iteration pass**: review and improve any sprite sheets that need it after
   initial generation — the four new types from GAME-060, the broker images from part 1,
   and optionally the governor sheet.

This ticket has no fixed scope for part 2 — it is the designated place to capture and
act on post-generation visual feedback. It is not a blocker for GAME-062 (broker wiring
is stretch); the core GAME-062 work (governor + 4 types) can proceed without it.

## Current State

GAME-060 art is not yet produced. This ticket opens once GAME-060 is complete.

## Goals / Acceptance Criteria

### Broker initial production (stretch)
- [ ] 9 broker PNG images generated via `gen-assets.main.kts` (3 variants × 3 eval states)
- [ ] Images committed to `game/assets/characters/` per naming in `sprite-spec.json`

### Quality iteration
- [ ] Each produced sprite sheet reviewed at display size (≈100–120 px height) on dark bg
- [ ] Any sheets identified as needing improvement: regenerated or hand-edited
- [ ] All reviewed sheets signed off before this ticket closes
- [ ] `ALT-TEXT.md` (if it exists) updated if descriptions change

## References

- `thoughts/shared/tickets/GAME-060-character-sprite-assets.md` — primary art production
- `thoughts/shared/tickets/DESIGN-011-per-criterion-character-roster.md` — art spec
- `tools/sprite-spec.json` — broker variants spec
- `game/assets/characters/` — sprite sheet files
