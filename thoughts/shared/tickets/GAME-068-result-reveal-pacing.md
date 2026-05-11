---
id: GAME-068
title: Result screen reveal pacing — true sequential reveal + dedicated Skip button
area: game, UX
status: resolved
created: 2026-05-07
---

## Summary

The GAME-066 sequential reveal uses a 400ms stagger between rows, which is much
shorter than the ~1650ms per-row duration (300ms fade + 1200ms hold + 150ms flip).
This causes multiple rows to be in CHECKING state simultaneously — producing a
"wave of criteria, then wave of results" feel rather than true one-at-a-time
suspense. Additionally, click-anywhere-to-skip is unintuitive; replace with a
visible "Skip →" button.

## Current State

- 400ms stagger → rows heavily overlap in CHECKING state (GAME-066)
- Skip: click anywhere on result screen (implicit, undiscoverable)
- No drum-roll audio yet (GAME-061 pending)

## Goals / Acceptance Criteria

- [ ] True sequential reveal: each row's full cycle (fade + hold + flip) completes
      before the next row starts — no simultaneous CHECKING states
- [ ] Per-row timing: 300ms fade → 1200ms CHECKING hold → 150ms flip → next row
      (chain delay ≈ 1650ms between row starts)
- [ ] Dedicated "Skip →" button visible during animated reveal; hidden otherwise
      (reduced-motion path, already-done state)
- [ ] Clicking "Skip →" clears all pending timeouts and finalises all rows instantly
- [ ] Remove click-anywhere-to-skip (replaced by the button)
- [ ] prefers-reduced-motion: no change — already renders instantly with no button

## Test Coverage

- [ ] e2e: updated skip test uses "Skip →" button, not result screen click
- [ ] e2e: verify only one row visible at a time during animated reveal (optional — hard to time)

## References

- `thoughts/shared/tickets/GAME-066-result-screen-dramatic-reveal-impl.md` — parent
- `game/web/index.html` — result screen HTML
- `game/web/src/main.ts` — `showResultScreen()` reveal loop
- `game/web/styles.css` — `#btn-reveal-skip`
