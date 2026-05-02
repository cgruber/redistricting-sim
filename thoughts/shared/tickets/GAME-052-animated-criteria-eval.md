---
id: GAME-052
title: Animated criteria evaluation on result screen
area: game, UX
status: resolved
created: 2026-04-29
github_issue: 188
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

- [x] Criteria rows animate in sequentially on result screen load
- [x] Pass/fail state revealed per-row after brief delay (120ms stagger, 0.3s reveal)
- [x] Party reaction (emoji or character art) displayed for overall pass/fail outcome
- [x] Animation skippable (click/tap to fast-forward)

## Test Coverage

*Specify after DESIGN-001.*

- [x] e2e test: result screen does not show all criteria simultaneously before animation
- [x] e2e test: clicking during animation completes it immediately
- [x] e2e test: final state matches non-animated result (regression)

## Resolution

CSS `@keyframes criterionReveal` (opacity 0→1 + translateY 8px→0, 0.3s ease). Each `.result-criterion` starts with `opacity:0` and animates in; `animationDelay = index * 120ms` staggers the reveal. A one-time click handler on `#result-screen` fast-forwards all rows by setting `animation:none; opacity:1`. `#result-reaction` shows 🎉 on pass, 💔 on fail. 4 e2e tests in `sprint4.spec.ts`. Merged PR #189.

## References

- `thoughts/shared/tickets/DESIGN-001-achievement-star-system.md` — **blocks this ticket**
- `game/web/src/main.ts` — result screen rendering
- `thoughts/shared/tickets/GAME-030-main-menu-and-campaigns.md` — S11 context
