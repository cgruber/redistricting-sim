---
id: GAME-064
title: Audio playback infrastructure — preload, mute toggle, autoplay handling
area: game, UX, infrastructure
status: open
created: 2026-05-02
github_issue: 193
---

## Summary

Build the audio playback layer that GAME-062 (character reaction system) will call
into. Handles preloading clips, browser autoplay policy, a mute toggle persisted to
localStorage, and accessibility. Separate from GAME-061 (which sources the actual
clips) and GAME-062 (which decides when to play).

## Current State

No audio exists in the game. No `<audio>` elements, no Web Audio API usage, no mute
state, no preload strategy.

## Goals / Acceptance Criteria

- [ ] `AudioPlayer` module in `game/web/src/` exposes:
      `preload(clips: Record<string, string>): void`
      `play(name: string): void` — no-ops if muted or unavailable
      `setMuted(muted: boolean): void` — persists to localStorage
      `isMuted(): boolean`
- [ ] Autoplay policy: if browser blocks autoplay, `play()` silently no-ops
- [ ] Mute state persisted to localStorage key `redistricting-sim-audio-muted`
- [ ] `prefers-reduced-motion` does NOT affect audio (independent preferences)
## Test Coverage

- [ ] Unit: mute toggle round-trips through localStorage (setMuted(true) → isMuted() === true → reload → isMuted() === true)
- [ ] Unit: play() no-ops when muted (no error thrown; no audio started)
- [ ] Unit: preload() registers clip names; play() of unknown name → silent no-op
- [ ] No audio files required for tests — stub URLs sufficient

## References

- `thoughts/shared/tickets/GAME-063-asset-pipeline.md` — asset URLs depend on this
- `thoughts/shared/tickets/GAME-061-audio-clips.md` — provides actual clip files
- `thoughts/shared/tickets/GAME-062-character-reaction-system.md` — calls AudioPlayer
