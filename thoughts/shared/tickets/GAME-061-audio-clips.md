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

## Current State (updated 2026-05-14)

Audio assets placed in `game/web/assets/audio/`. Naming scheme extended to gender-keyed
variants for human characters (`{type}-{state}-m.mp3` / `{type}-{state}-f.mp3`). All
active clips normalized to −16 LUFS. See `INVENTORY.md` for full details.

**Done:**
- Governor, commissioner, legislator: approve-m, approve-f, disapprove-m, disapprove-f (real audio, CC0)
- Judge: approve, neutral, disapprove (gavel — gender-neutral)
- Party: approve, neutral (crowd sounds — gender-neutral)
- `candidates/` subdirectory: future sounds inventoried (interrogative huh?, assent/listening)

**Remaining stubs (zero-byte):**
- `governor-neutral.mp3`, `legislator-neutral.mp3` (thinking/pondering sound needed)
- `commissioner-neutral.mp3` is gavel (may not fit; revisit)
- `party-disapprove.mp3` (crowd boo needed)
- No gender-keyed neutral variants yet for human characters

## Goals / Acceptance Criteria

- [x] Audio clips for 5 instigator types × 3 evaluation states — minimum 10 met; 12 real clips active
- [x] File naming: gender-keyed `{type}-{state}-m/f` for human characters; bare `{type}-{state}` for judge/party
- [x] Clips short: 0.6–2.35s each
- [x] File sizes < 100 KB per clip
- [x] Source priority honoured: all CC0 from freesound.org / BigSoundBank
- [x] Asset inventory document (`game/web/assets/audio/INVENTORY.md`) complete
- [x] Zero-byte placeholder stubs for missing states (GAME-062 can wire without blocking)
- [x] Assets placed in `game/web/assets/audio/`
- [x] All clips normalized to −16 LUFS (EBU R128)
- [ ] Remaining stubs filled: governor-neutral-m/f, legislator-neutral-m/f, party-disapprove
- [ ] commissioner-neutral revisited (gavel may not fit a person character)

## References

- `thoughts/shared/tickets/DESIGN-009-character-reaction-visual-style.md` — resolved; defines instigator roster and audio tone guidance per type
- `thoughts/shared/tickets/GAME-063-asset-pipeline.md` — asset directory must exist first
- `thoughts/shared/tickets/GAME-064-audio-playback-infrastructure.md` — playback layer
- `thoughts/shared/tickets/GAME-062-character-reaction-system.md` — wires audio playback
