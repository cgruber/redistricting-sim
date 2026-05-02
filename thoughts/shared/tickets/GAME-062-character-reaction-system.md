---
id: GAME-062
title: Character reaction system — animate and audio on result screen
area: game, UX
status: open
created: 2026-05-02
---

## Summary

Wire the instigator reaction system to the result screen: resolve the instigator type
from the scenario, load the correct star-count state SVG, inject it into
`#result-reaction`, and play the matching audio clip. Replaces the 🎉/💔 emoji
placeholder (GAME-052). The player is a neutral consultant; the instigator (party
boss, judge, commissioner, etc.) reacts based on star count (3/2/1/0), not binary
pass/fail. Animation plays last, after all per-criterion reveal animations finish.
Depends on DESIGN-009 (style), GAME-060 (art), GAME-061 (audio), GAME-063
(asset pipeline), and GAME-064 (audio playback infrastructure).

## Current State

The result screen shows a `#result-reaction` element with a single emoji (🎉/💔)
based on overall pass/fail. Scenario instigator identity is not used on the result
screen. No star-count grading exists on the result screen.

## Goals / Acceptance Criteria

- [ ] Instigator type resolved from scenario's `narrative.character` role
- [ ] Star count computed from criterion results (required criteria only)
- [ ] Correct SVG loaded from `assets/characters/{type}/{state}.svg` and injected
      into `#result-reaction`; sized and positioned per DESIGN-009 spec
- [ ] Star-count state maps correctly: 3 required criteria met → three-star; etc.
- [ ] Audio clip plays on result screen open via GAME-064 AudioPlayer
- [ ] Mute toggle visible on result screen; uses GAME-064 persistence
- [ ] `prefers-reduced-motion`: SVG idle animation suppressed (CSS); audio unaffected
- [ ] Scenario-006 Bipartisan Broker: both bosses shown side-by-side (split-screen)
- [ ] Fallback: if instigator type has no asset, emoji placeholder remains
- [ ] Instigator reaction plays AFTER per-criterion animations complete (timing)

## Test Coverage

- [ ] e2e: `#result-reaction` contains character element (not bare emoji) after scenario submit
- [ ] e2e: character element has `.pass` class on overall pass; `.fail` on overall fail
- [ ] e2e: `<audio>` element present and wired on result screen
- [ ] e2e: mute toggle visible; persists across result screen re-open (via localStorage)
- [ ] e2e: `prefers-reduced-motion` — character element has `animation: none` applied

## References

- `thoughts/shared/tickets/DESIGN-009-character-reaction-visual-style.md` — **blocks this**
- `thoughts/shared/tickets/GAME-060-character-sprite-assets.md` — **blocks this**
- `thoughts/shared/tickets/GAME-061-audio-clips.md` — **blocks this**
- `thoughts/shared/tickets/GAME-063-asset-pipeline.md` — **blocks this**
- `thoughts/shared/tickets/GAME-064-audio-playback-infrastructure.md` — **blocks this**
- `thoughts/shared/tickets/GAME-059-submit-on-invalid.md` — failure path this plays on
- `game/web/src/main.ts` — `showResultScreen()` + `#result-reaction` element
