---
id: GAME-110
title: Extract win/star verdict logic out of the controller into the tested layer
area: game, code-quality, architecture
status: open
created: 2026-06-27
---

## Summary

The functions that decide whether the player won and how many stars they earn — the central
game output — live inline in the untested `main.ts` controller, and the verdict UI logic is
duplicated and already divergent. Move the pure logic into the unit-tested layer and unify the
UI path. From the 2026-06-27 quality review (top-10 #8; grok recommends doing this restructure
**first** among the refactors — pure logic, ~zero regression risk, shrinks later `main.ts`
cleanup).

## Current State

- `computeStarCount` (`main.ts:878-882`) and `buildValidityRows` (`main.ts:840-876`) are
  essentially pure functions of the eval/validity result but sit inline in the single async
  IIFE with no `main_test.ts`. Their inputs (`evaluateCriteria`, `computeValidityStats`,
  `isMapSubmittable`) are unit-tested, but the star/validity arithmetic itself is verifiable
  only through e2e against the real store. `computeStarCount` has a 1-base-plus-optional rule;
  `buildValidityRows` has a skip-when-equivalent-criterion rule — exactly the off-by-one logic
  that wants a unit test.
- Verdict UI is duplicated: `revealVerdict` (`main.ts:1139-1162`) vs `syncOverallVerdict`
  (`1212-1237`) each set verdict text/class/opacity/subtitle, call `preparePostWin`, and
  render stars — and they **already differ** (revealVerdict has a structural-issues subtitle
  branch the other lacks), so the debug-replay path can show a different message.

## Goals / Acceptance Criteria

- [ ] Move `computeStarCount` (and the verdict-deciding pure parts) into a `simulation/verdict.ts` (or fold into `evaluate.ts`) as exported pure functions; treat verdict as a pure **projection** of `evaluate` + `validity` results (grok note), removing the decision logic from the controller — not just relocating it.
- [ ] Extract one `applyVerdictUI(pass, starCount, subtitleOverride?)` that both `revealVerdict` and `syncOverallVerdict` call, so the normal and debug-replay paths can't diverge.
- [ ] **Coordinate with GAME-074** — that ticket plans to remove `buildValidityRows`/`isMapSubmittable`/`mapIsValid` when collapsing the dual validity/criteria model. Decide whether `buildValidityRows` is extracted-then-tested here or removed there; do not duplicate effort. If GAME-074 lands first, this ticket narrows to `computeStarCount` + the `applyVerdictUI` dedup.

## Test Coverage

- [ ] `verdict_test.ts`: all-required-pass-no-optional = 1 star; each optional pass increments; invalid map = 0 stars; the validity-row-vs-criterion de-duplication branch (if still present).
- [ ] A test (or shared call site) proving the normal and debug-replay verdict paths produce identical text/stars for the same result.

## References

- Review: `thoughts/shared/research/2026-06-27-codebase-quality-review.md` (Theme 2; External second opinion — sequencing)
- `game/web/src/main.ts`, `game/web/src/simulation/evaluate.ts`, `game/web/src/simulation/validity.ts`
- Related: GAME-074 (validity/criteria collapse — coordinate), GAME-042 (main.ts decomposition — this is one extractable unit)
