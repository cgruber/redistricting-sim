---
id: GAME-061
title: Audio clips for result screen character reactions
area: game, audio, content
status: open
created: 2026-05-02
---

## Summary

Source or create short audio clips for each character type × outcome (pass/fail)
to accompany the animated reactions on the result screen. Prefer CC0 sources to
avoid attribution requirements. If suitable CC0 clips are unavailable, use
AI-generated audio (multimodal models such as Grok, ElevenLabs Sound Effects, or
similar). Character audio tone defined by DESIGN-009.

## Current State

No audio exists anywhere in the game. This is the first audio feature.

## Goals / Acceptance Criteria

- [ ] One audio clip per character type × 2 outcomes (pass / fail) — 10 clips total
- [ ] Clips are short: target 1–3 seconds each
- [ ] Format: MP3 + OGG dual encoding for broad browser support
- [ ] File sizes appropriate for browser delivery (target: < 100 KB per clip)
- [ ] Source priority: (1) CC0 from freesound.org/pixabay, (2) AI-generated,
      (3) CC-BY with in-game attribution
- [ ] Asset inventory document listing: character type, outcome, filename, source,
      license for each clip
- [ ] Assets placed in `game/web/assets/audio/` (see GAME-063)

## References

- `thoughts/shared/tickets/DESIGN-009-character-reaction-visual-style.md` — **blocks this**
  (defines character roster and tone guidance)
- `thoughts/shared/tickets/GAME-063-asset-pipeline.md` — asset directory must exist first
- `thoughts/shared/tickets/GAME-064-audio-playback-infrastructure.md` — playback layer
- `thoughts/shared/tickets/GAME-062-character-reaction-system.md` — wires audio playback
