---
id: GAME-062
title: Character reaction system — animate and audio on result screen
area: game, UX
status: open
created: 2026-05-02
last_updated: 2026-05-13
---

## Summary

Wire the character reaction system to the result screen: resolve character type from
the scenario/criterion, load the correct PNG sprite sheet pose, inject it into the
result screen, and play the matching audio clip. The evaluation state model uses
three states — **approve**, **neutral**, **disapprove** — not a 1:1 star-count
mapping. Replaces the 🎉/💔 emoji placeholder (GAME-052). Depends on GAME-060
(art) and GAME-061 (audio).

The **governor** per-criterion reaction is already implemented (GAME-069): each
criterion row has an `.rc-char` slot; the governor sprite sheet is loaded and posed
based on star count → evaluate state mapping.

## Current State

- Governor PNG reaction: **done** — sprite loaded, 3-state (approve/neutral/disapprove)
  mapped from star count; CSS bob animation; `prefers-reduced-motion` handled
- Per-criterion `.rc-char` slot structure: **done** (GAME-069)
- 4 remaining character types (commissioner/party/judge/legislator): pending GAME-060 art
- Audio: pending GAME-061
- Scenario-006 bipartisan-broker instigator: pending broker PNG production (stretch; spec in `tools/sprite-spec.json`; no ticket assigned yet)

## Goals / Acceptance Criteria

### Already done
- [x] `narrative.instigator` optional field in scenario format
- [x] Per-criterion `.rc-char` slot rendered for each criterion row (GAME-069)
- [x] Governor sprite sheet loaded and posed; neutral → approve/disapprove cross-fade
- [x] Star count → evaluation state mapping: disapprove=0 stars, neutral=min-required-only, approve=bonus criteria met
- [x] `prefers-reduced-motion`: animation suppressed

### Remaining (blocks on GAME-060 + GAME-061)
- [ ] Commissioner, party, judge, legislator sprite sheets loaded and posed
      per DESIGN-011 criterion → character mapping
- [ ] Audio clip plays on result screen open via GAME-064 AudioPlayer
- [ ] Mute toggle visible on result screen; uses GAME-064 persistence
- [ ] Fallback: if character type has no asset, show neutral placeholder or emoji
- [ ] Character reaction plays AFTER per-criterion animations complete (timing)
- [ ] Scenario-006 instigator: bipartisan-broker PNG loaded (stretch; pending broker PNG production — no ticket yet; not a blocker for GAME-062 core)

## Test Coverage

- [x] e2e: `#result-reaction .character-sprite` present after scenario-002 submit
- [ ] e2e: correct aria-label on character element
- [ ] e2e: `<audio>` element present and wired (after GAME-061)
- [ ] e2e: mute toggle visible; persists via localStorage
- [ ] e2e: `prefers-reduced-motion` — animation suppressed

## References

- `thoughts/shared/tickets/DESIGN-009-character-reaction-visual-style.md` — style spec
- `thoughts/shared/tickets/DESIGN-011-per-criterion-character-roster.md` — character roster + criterion mapping
- `thoughts/shared/tickets/GAME-060-character-sprite-assets.md` — art (blocks remaining items)
- `thoughts/shared/tickets/GAME-061-audio-clips.md` — audio (blocks remaining items)
- `thoughts/shared/tickets/GAME-064-audio-playback-infrastructure.md` — AudioPlayer module
- `game/web/src/main.ts` — `showResultScreen()` + `.rc-char` elements
- `game/assets/characters/character-governor.png` — reference implementation
