---
id: GAME-070
title: Audio settings panel — volume control and mute toggle
area: game, UX, audio
status: open
created: 2026-05-14
---

## Summary

Implement an audio settings panel accessible from the main menu Settings item (stubbed
but disabled in GAME-050). Provides volume control (master + optionally per-category)
and a persistent mute toggle. The existing per-screen mute toggle (GAME-064/GAME-062)
is promoted into this settings panel; in-game access may remain as a quick-toggle but
should share the same persistence layer. All settings persist to localStorage.

## Current State

- GAME-064 AudioPlayer: `preload` / `play` / `setMuted` / `isMuted` functions exist;
  mute state persisted under `redistricting-sim-audio-muted` in localStorage.
- GAME-050 main menu: Settings item exists in nav but is disabled (no panel rendered).
- GAME-062: mute toggle planned for result screen; should defer to or reuse GAME-070 UI.

## Goals / Acceptance Criteria

### Settings panel
- [ ] Settings panel reachable from main menu Settings item (replaces disabled stub)
- [ ] Panel contains: Master Volume slider (0–100%), Mute toggle (checkbox or button)
- [ ] Mute toggle calls `setMuted()` / `isMuted()` from AudioPlayer — no separate storage key
- [ ] Master volume stored in localStorage under `redistricting-sim-audio-volume`
- [ ] AudioPlayer `play()` respects master volume (applies `audio.volume` before playback)
- [ ] Panel is closeable; main menu remains usable after closing
- [ ] Settings accessible from within a running scenario (stretch: quick-access icon in HUD)

### Persistence
- [ ] Volume and mute state restored on page load from localStorage
- [ ] Defaults: volume = 100%, muted = false

### Visual style
- [ ] Consistent with dark HUD aesthetic (see `project_visual_aesthetic.md` memory)
- [ ] Mute toggle visually matches the result-screen mute toggle (GAME-062 AC) in style

### Test Coverage
- [ ] Unit: `play()` applies stored volume from localStorage on AudioPlayer init
- [ ] Unit: `setMuted(true)` + `play()` → audio.play() not called (already covered in GAME-064; verify still passes)
- [ ] e2e: Settings item in main menu is clickable and opens panel
- [ ] e2e: Volume slider change persists after page reload
- [ ] e2e: Mute toggle change persists after page reload

## References

- `game/web/src/audio/audioPlayer.ts` — AudioPlayer module (GAME-064)
- `game/web/src/audio/audioPlayer_test.ts` — existing unit tests
- `thoughts/shared/tickets/GAME-050-main-menu.md` — Settings stub origin
- `thoughts/shared/tickets/GAME-062-character-reaction-system.md` — result-screen mute toggle (coordinate)
- `thoughts/shared/tickets/GAME-064-audio-playback-infrastructure.md` — AudioPlayer API
