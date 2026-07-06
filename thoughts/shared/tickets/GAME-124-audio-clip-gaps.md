---
id: GAME-124
title: Audio clip gaps — 0-byte placeholders return HTTP 416
area: game, audio, content
status: open
created: 2026-07-06
---

## Summary

Several character-reaction audio clips ship as **0-byte placeholder files**, so a
browser range request against them returns **HTTP 416** (a console error) and no
sting plays. Surfaced in the 2026-07-06 tutorial playtest (one console error plus
several warnings).

Affected (all 0 bytes, under `game/web/assets/audio/`):

- `party-disapprove.mp3` / `party-disapprove.ogg`
- `governor-neutral.mp3` / `governor-neutral.ogg`
- `legislator-neutral.mp3` / `legislator-neutral.ogg`

## Current State

- The audio system (GAME-070 settings, GAME-071 character assignment, GAME-072
  optional-criterion neutral audio) references these clips, but the assets were
  never produced — the files exist as empty placeholders so the manifest resolves.
- `audioPlayer` does not guard against empty/absent clips, so the browser attempts a
  range request and logs a 416.

## Goals / acceptance criteria

- [ ] Produce the missing clips (GAME-070/071/072 audio lineage), **and/or**
- [ ] Guard `audioPlayer` to skip 0-byte / absent clips so the console stays clean
      (no 416, no unhandled rejection).
- [ ] Verify a tutorial playthrough produces **no console errors** from audio.
- [ ] (Optional) Silence the wasm-bindgen deprecated-init warning: `wasm_calc_bindgen`
      is initialized positionally; pass a single `{ module_or_path }` object instead.

## References

- Playtest: 2026-07-06 tutorial-005 run (console dump included `416 party-disapprove.mp3`).
- Assets: `game/web/assets/audio/*-{neutral,disapprove}.{mp3,ogg}` (0-byte).
- Player: `game/web/src/**/audioPlayer*` (guard site).
- Related: GAME-070, GAME-071, GAME-072.
