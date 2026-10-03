---
id: GAME-131
title: Per-campaign wrap-up — tutorial completion shows the educational wrap-up
area: game, content, UX
status: open
created: 2026-10-02
---

# GAME-131: Per-campaign wrap-up — tutorial completion shows the educational wrap-up

## Summary

Finishing the tutorial campaign shows the educational campaign's wrap-up screen. Beta players who
complete tutorial-006 are told they have "completed every scenario" and "drawn maps that packed
voters, cracked communities, protected incumbents, satisfied reformers" — none of which the
tutorial covers, and the educational campaign is still "coming soon" on beta.

## Current State

- `goToNextScenario()` (`game/web/src/main.ts:1880`) shows the single static `#wrap-up-screen`
  whenever the active campaign list is exhausted, regardless of which campaign it is.
- The wrap-up copy (`game/web/index.html:140`) was written for the educational arc.
- The tutorial campaign has no `comingSoon` gate and tutorial-006 is its last entry
  (`game/web/src/model/campaigns.ts`). Beta serves v0.0.17, which has the same campaign list,
  wrap-up copy, and end-of-list logic, so beta is affected (per the deployed build; not clicked
  through on beta itself).
- Reproduced on serve-local: `?s=tutorial-006&campaign=tutorial&debug` → Force Win → Continue →
  Next Scenario →.

The educational copy itself also needs an owner pass: it predates the VRA arc (scenario-005 /
scenario-010) and ends on a contested conclusion ("proven that no set of rules can make
redistricting apolitical"), against the About page's "better questions, not predetermined
answers" and DESIGN-014.

## Goals / Acceptance Criteria

- [ ] Wrap-up text is per-campaign (e.g. a `wrapUp` field on `Campaign`, or equivalent).
- [ ] Tutorial completion shows tutorial-appropriate text that points the player onward (or notes
  the educational campaign is coming).
- [ ] Educational wrap-up copy approved by the owner (covers the VRA arc; neutral per DESIGN-014).

The tutorial half does not depend on the educational-copy decision and can land first.

## Test Coverage

- [ ] e2e: finishing the last tutorial (`?campaign=tutorial`, tutorial-006) shows the tutorial
  wrap-up text, not the educational one.
- [ ] e2e: finishing the last educational scenario shows the educational wrap-up.
- [ ] Unit (if wrap-up text lives on `Campaign`): every registered campaign has non-empty wrap-up
  text (`campaigns_test`).

## References

- `game/web/src/main.ts:1880` — `goToNextScenario()`
- `game/web/index.html:140` — wrap-up copy
- `game/web/src/model/campaigns.ts` — campaign registry
- `thoughts/shared/research/2026-10-02-educational-campaign-coherence-review.md` — Tier 2
