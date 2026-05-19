---
id: GAME-073
title: "Result screen: deferred success banner + star count reveal"
area: game, UX, audio
status: resolved
created: 2026-05-18
---

## Summary

Currently the "Map Passed!" / "Map Failed" verdict and subtitle are shown at the top
of the result screen before any criteria are revealed. This breaks the dramatic reveal
flow. The redesign:

- **Failure**: verdict banner may appear immediately on the first failing *required*
  criterion (to signal the map won't pass early). Optional failures remain silent.
- **Success**: verdict banner and star count (1/2/3 stars) appear only AFTER all
  criteria have been revealed and evaluated.
- Stars follow the existing design (1 = required-only pass, 2 = some optional passed,
  3 = all criteria passed).
- Completion audio: "tada" on success, "womp-womp" on required-criterion failure.

## Current State

- `resultVerdict.textContent` and `resultSubtitle.textContent` set immediately in
  `showResultScreen()` before the reveal loop starts (`main.ts` ~line 920).
- `computeStarCount()` exists but star display is not shown in the result screen UI.
- No tada/womp-womp audio clips exist.

## Goals / Acceptance Criteria

### Verdict banner timing
- [ ] On map load into result screen: verdict banner hidden (or shows neutral "Evaluating…")
- [ ] First failing *required* criterion reveal: show failure banner immediately
- [ ] After all rows revealed with no required failures: show success banner + star count
- [ ] Skip button: jumps to final state — banner + stars shown immediately

### Star count UI
- [ ] Star display element added to result screen header (1–3 star icons)
- [ ] 1 star: all required criteria pass, zero optional pass
- [ ] 2 stars: all required pass, some (but not all) optional pass
- [ ] 3 stars: all criteria pass (required + all optional)
- [ ] Stars animate in (simple fade/scale) when banner appears; no animation in reduced-motion mode

### Audio
- [ ] New "tada" clip (~1–2s, triumphant, −16 LUFS) plays when success banner appears
- [ ] New "womp-womp" clip (~1s, failure trombone/deflated, −16 LUFS) plays when first
      required failure is revealed
- [ ] Clips registered in INVENTORY.md and preloaded with the scenario

### Reduced-motion / final path
- [ ] Reduced-motion path: banner + stars shown immediately in final state

## Test Coverage

- [ ] e2e: verdict banner hidden at start of reveal on a passing map
- [ ] e2e: success banner + stars visible after all rows finalized on a passing map
- [ ] e2e: failure banner visible after first required-fail row on a failing map
- [ ] e2e: skip button shows banner + stars immediately

## References

- `game/web/src/main.ts` — `showResultScreen()`, `computeStarCount()`, `finalizeRow()`
- `game/web/styles.css` — result screen layout
- `thoughts/shared/research/2026-05-02-DESIGN-001-achievement-star-system.md` — star design
- `thoughts/shared/tickets/GAME-072-optional-criterion-neutral-audio.md` — related audio
