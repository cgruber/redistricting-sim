---
id: GAME-018
title: Scenario progression — sequential unlock and scenario select screen
area: game, content
status: open
created: 2026-04-26
---

## Summary

Players should progress through scenarios in order, with each completion unlocking the next. This requires a scenario select screen (showing completed, current, and locked scenarios) and a completion signal flowing from the evaluation phase. Progress is persisted in localStorage so it survives page reload.

## Current State

There is only one scenario and no concept of "current scenario" — the app always loads `kalanoa_westford.json` directly. There is no scenario select screen and no persistence of completion state.

## Goals / Acceptance Criteria

- [ ] Scenario select screen replaces direct-load-into-editor; shows all known scenarios as cards: completed (with achievement indicator), unlocked-current, locked (visible but dimmed)
- [ ] Completing a scenario (passing evaluation in GAME-017) marks it complete in localStorage and unlocks the next
- [ ] Selecting an unlocked scenario loads its intro (GAME-016) then editor
- [ ] Returning players land on scenario select (not intro), with progress restored from localStorage
- [ ] Works with 1 scenario (tutorial) without crashing; gracefully handles "all scenarios complete"
- [ ] Scenario manifest (ordered list of scenario file paths) is a config file or hardcoded list — not auto-discovered

## Test Coverage

- [ ] Unit: localStorage read/write for completion state (pure serialization functions)
- [ ] e2e: scenario select screen visible on initial load (before any scenario chosen)
- [ ] e2e: completing a scenario (mocked pass signal) marks it complete and shows next as unlocked
- [ ] e2e: page reload restores completion state

## References

- Vision §PROGRESSION, §MENU, §LOOP
- `game/web/src/main.ts` — current entry point
- Depends on: GAME-016 (intro), GAME-017 (evaluation/pass signal)
- GAME-007 (player progress persistence) — overlapping scope; review before starting; may subsume or be subsumed
