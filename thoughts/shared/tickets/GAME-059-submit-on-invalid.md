---
id: GAME-059
title: Submit-on-invalid maps — allow submission of invalid maps
area: game, UX
status: open
created: 2026-05-02
---

## Summary

Remove the validity gate from the Submit button so players can submit any map —
including invalid ones — and see a full result screen with animated failure feedback
and a clear path back to editing. Currently the Submit button is disabled until the
map passes all validity checks, which prevents failure animations from ever playing
and removes a teachable moment.

## Current State

`isMapSubmittable()` in `evaluate.ts` gates the Submit button. An invalid map shows
a disabled Submit button with validity errors in the sidebar panel. Players cannot
reach the result screen without first satisfying all structural constraints.

## Goals / Acceptance Criteria

- [ ] Submit button is always enabled (never disabled due to validity)
- [ ] Result screen correctly handles invalid maps: shows which validity constraints
      are unmet as failed criteria alongside success criteria
- [ ] Invalid-map result screen shows "Fix It" / "Keep Drawing" button only
      (no "Next Scenario" — progression gated on actual win)
- [ ] Valid-but-failing result screen unchanged: "Keep Drawing" shown, "Next Scenario"
      hidden
- [ ] Winning result screen unchanged: both buttons shown as before
- [ ] Validity sidebar panel still updates live during drawing (no regression)

## Test Coverage

- [ ] e2e: submit with empty assignments (invalid) → failure result screen shown
- [ ] e2e: submit with valid-but-failing criteria → failure result screen shown, no "Next Scenario"
- [ ] e2e: submit with passing map → pass result screen shown with "Next Scenario"
- [ ] e2e: "Fix It" / "Keep Drawing" button present on invalid/fail result; absent on pass result
- [ ] e2e: validity sidebar panel updates live during drawing (regression guard)

## References

- `game/web/src/simulation/evaluate.ts` — `isMapSubmittable()` gate
- `game/web/src/main.ts` — Submit button wiring + `showResultScreen()`
- `game/web/src/simulation/validity.ts` — validity stats
- `thoughts/shared/tickets/GAME-062-character-reaction-system.md` — failure
  animations that play on this screen
