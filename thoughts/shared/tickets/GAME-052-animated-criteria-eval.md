---
id: GAME-052
title: Animated criteria evaluation on result screen
area: game, UX
status: open
created: 2026-04-29
---

## Summary

Animate the criteria evaluation sequence on the result screen — reveal each
criterion pass/fail result with a brief animation and optional party reaction.
Blocked on DESIGN-001 (achievement/star UX), which must settle the visual
language for pass/fail before this can be implemented.

## Current State

The result screen renders all criteria pass/fail rows immediately with no
animation. There are no party reactions.

## Goals / Acceptance Criteria

*Placeholder — to be fully specced after DESIGN-001 resolves the visual language.*

- [ ] Criteria rows animate in sequentially on result screen load
- [ ] Pass/fail state revealed per-row after brief delay (timing TBD per DESIGN-001)
- [ ] Party reaction (emoji or character art) displayed for overall pass/fail outcome
- [ ] Animation skippable (click/tap to fast-forward)

## Test Coverage

*Specify after DESIGN-001.*

- [ ] e2e test: result screen does not show all criteria simultaneously before animation
- [ ] e2e test: clicking during animation completes it immediately
- [ ] e2e test: final state matches non-animated result (regression)

## References

- `thoughts/shared/tickets/DESIGN-001-achievement-star-system.md` — **blocks this ticket**
- `game/web/src/main.ts` — result screen rendering
- `thoughts/shared/tickets/GAME-030-main-menu-and-campaigns.md` — S11 context
