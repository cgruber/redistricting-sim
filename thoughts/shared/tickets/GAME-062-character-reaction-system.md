---
id: GAME-062
title: Character reaction system — wire remaining types + audio to result screen
area: game, UX
status: open
created: 2026-05-02
last_updated: 2026-05-13
---

## Summary

Wire the four remaining character types (commissioner, judge, legislator, party) to
the result screen reaction system. Governor is already fully wired (GAME-069). All
PNG sprite sheets exist on disk. This ticket covers: measuring pose offsets for the
1408×768 sheets, adding per-type demographic selection to the scenario format,
writing the wiring code in `buildCharSlotChildren()`, and connecting the audio
layer (GAME-061). Replaces the placeholder SVG fallback for all known types.

## Current State

- Governor PNG reaction: **done** — 3-state sprite (approve/neutral/disapprove),
  deterministic demographic from scenario ID hash, CSS bob animation,
  `prefers-reduced-motion` handled (GAME-069)
- Per-criterion `.rc-char` slot structure: **done** (GAME-069)
- PNG sprite sheets for all 5 types: **exist on disk** — see `game/web/assets/characters/`
- commissioner/judge/legislator/party wiring: **not done** — falls through to placeholder SVG
- Pose offsets for 1408×768 sheets: **not documented** — need to measure from actual images
- Per-type demographic selection in scenario format: **not done** — current code uses single
  hash-derived index across all types; scenario JSON needs `narrative.character_demographics`
- Audio: pending GAME-061

## Goals / Acceptance Criteria

### Already done
- [x] Per-criterion `.rc-char` slot rendered for each criterion row (GAME-069)
- [x] Governor sprite sheet loaded and posed; neutral → approve/disapprove cross-fade
- [x] Star count → evaluation state mapping: 0 stars=disapprove, required-only=neutral, any bonus=approve
- [x] `prefers-reduced-motion`: animation suppressed
- [x] `narrative.instigator_character` field resolved at render time

### Scenario format: per-type demographic assignment
- [ ] Add `narrative.character_demographics: Record<string, string>` to scenario type
      (e.g. `{ "governor": "bm", "commissioner": "wf", "judge": "naf", "legislator": "wm" }`)
- [ ] `party` excluded — single group asset, no demographic variants
- [ ] Update all existing scenario JSON files with demographic assignments
- [ ] Fall back to first available variant if key absent (forward-compat)

### Sprite wiring: commissioner, judge, legislator, party
- [ ] Measure and document pose pixel offsets for 1408×768 commissioner/judge/legislator sheets
      (same approach as GOV_SHEET constants in main.ts)
- [ ] Measure and document pose pixel offsets for 1408×768 party sheet
- [ ] `buildCharSlotChildren()` handles all 5 types with real sprites; placeholder SVG
      retained only as fallback for unknown/future types
- [ ] Demographic selection reads from `scenario.narrative.character_demographics[type]`
- [ ] Party type: no demographic — single `party/sheet.png` used

### Audio (depends on GAME-061)
- [x] Audio clip plays on result screen open via GAME-064 AudioPlayer
- [x] Mute toggle visible on result screen; uses GAME-064 persistence

### Remaining edge cases
- [ ] Fallback: unknown character type → placeholder SVG (not a crash)
- [ ] Scenario-006 instigator: bipartisan-broker PNG loaded
      (stretch; spec in `tools/sprite-spec.json`; production in GAME-065)

## Test Coverage

- [x] e2e: `#result-reaction .character-sprite` present after scenario-002 submit
- [ ] e2e: non-governor character sprite rendered for a criterion using commissioner type
- [ ] e2e: correct aria-label on character element per evaluation state
- [ ] e2e: `<audio>` element present and wired on result screen (after GAME-061)
- [ ] e2e: mute toggle visible; persists via localStorage
- [ ] e2e: `prefers-reduced-motion` — animation suppressed

## Sprite sheet reference

All non-governor sheets: 1408×768. Pose offsets TBD (measure from images before coding).
Governor sheets: 1376×752. Offsets already in code: `{ neutral: {x:0,w:400}, approve: {x:400,w:480}, disapprove: {x:880,w:496} }`.

Demographic variants on disk:
- `governor-wm/`, `governor-bm/`, `governor-af/` — key = `wm` / `bm` / `af`
- `commissioner-wm/`, `commissioner-wf/`, `commissioner-bf/` — key = `wm` / `wf` / `bf`
- `judge/` (generic), `judge-lm/`, `judge-naf/` — key = `` (empty/default) / `lm` / `naf`
- `legislator-wm/`, `legislator-wf/`, `legislator-bm/` — key = `wm` / `wf` / `bm`
- `party/` — no demographic variant; always `party/sheet.png`

## References

- `game/web/src/main.ts` — `buildCharSlotChildren()`, `showResultScreen()`, `GOV_SHEET` constants
- `game/web/assets/characters/` — all sprite sheets + GENERATION.md per variant
- `thoughts/shared/tickets/GAME-061-audio-clips.md` — audio (blocks audio ACs)
- `thoughts/shared/tickets/GAME-064-audio-playback-infrastructure.md` — AudioPlayer module
- `thoughts/shared/tickets/GAME-065-character-sprite-art-refinement.md` — quality pass (not a blocker)
