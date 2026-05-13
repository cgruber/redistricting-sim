---
id: GAME-061
title: Audio clips for result screen instigator reactions
area: game, audio, content
status: open
created: 2026-05-02
github_issue: 199
---

## Summary

Source or create short audio clips for each instigator type × evaluation state
to accompany the animated reactions on the result screen. Target: 15 clips
(5 types × 3 states: approve/neutral/disapprove). Acceptable minimum: 10 clips
(2 per type: celebratory / disappointed) if sourcing 15 distinct clips proves
impractical. Prefer CC0 sources. If CC0 unavailable, use AI-generated audio
(ElevenLabs Sound Effects, Grok, or similar). Tone per type defined by DESIGN-009
(resolved — see that ticket for guidance).

## Current State

No audio exists anywhere in the game. This is the first audio feature.
`game/web/assets/audio/` directory exists (created in GAME-063).

## Goals / Acceptance Criteria

- [ ] Audio clips for 5 instigator types × 3 evaluation states — target 15, minimum 10 (2/type)
- [ ] File naming: `assets/audio/{type}-{state}.mp3` and `.ogg` (dual encoding)
      types: governor, commissioner, party, judge, legislator
      states: approve, neutral, disapprove (or: approve, disapprove if collapsed to 2/type)
- [ ] Clips are short: target 0.5–1.5 s each
- [ ] File sizes < 100 KB per clip
- [ ] Source priority: (1) CC0 from freesound.org/pixabay, (2) AI-generated,
      (3) CC-BY with in-game attribution
- [ ] Asset inventory document (`game/web/assets/audio/INVENTORY.md`) listing:
      type, state, filename, source URL, license for each clip
- [ ] Placeholder silent clips created for any states not yet sourced, so
      GAME-062 can be wired and tested without waiting for final audio
- [ ] Assets placed in `game/web/assets/audio/`

## References

- `thoughts/shared/tickets/DESIGN-009-character-reaction-visual-style.md` — resolved; defines instigator roster and audio tone guidance per type
- `thoughts/shared/tickets/GAME-063-asset-pipeline.md` — asset directory must exist first
- `thoughts/shared/tickets/GAME-064-audio-playback-infrastructure.md` — playback layer
- `thoughts/shared/tickets/GAME-062-character-reaction-system.md` — wires audio playback
