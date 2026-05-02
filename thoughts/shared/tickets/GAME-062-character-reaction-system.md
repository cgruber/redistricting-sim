---
id: GAME-062
title: Character reaction system — animate and audio on result screen
area: game, UX
status: open
created: 2026-05-02
---

## Summary

Wire `scenario.narrative.character` to the result screen: display the scenario
character's animated sprite, trigger the appropriate pass/fail animation state, and
play the matching audio clip. Replaces the 🎉/💔 emoji placeholder added in GAME-052.
Depends on DESIGN-009 (style), GAME-060 (art assets), GAME-061 (audio clips),
GAME-063 (asset pipeline), and GAME-064 (audio playback infrastructure).

## Current State

The result screen shows a `#result-reaction` element populated with a single emoji
(🎉 or 💔) based on overall pass/fail. Character identity from `scenario.narrative`
is not used on the result screen at all.

## Goals / Acceptance Criteria

- [ ] Result screen displays the scenario character's sprite in `#result-reaction`,
      sized and positioned per DESIGN-009 spec
- [ ] Pass state animation plays on overall pass; fail state on overall fail
- [ ] Audio clip plays on result screen open via GAME-064 AudioPlayer
- [ ] Mute toggle visible on result screen; uses GAME-064 persistence
- [ ] `prefers-reduced-motion`: animation suppressed; audio unaffected
- [ ] Character type resolved from scenario's character role
- [ ] Scenario-006 two-character case handled per DESIGN-009 decision
      (simultaneous split-screen or sequential)
- [ ] Fallback: if character type has no asset, emoji placeholder remains

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
