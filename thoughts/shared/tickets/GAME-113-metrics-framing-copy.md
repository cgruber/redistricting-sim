---
id: GAME-113
title: Metrics framing / teaching-copy pass — turnout, majority-minority, labels
area: game, content, UX
status: open
created: 2026-06-30
---

## Summary

The 2026-06-30 metrics audit found the math is sound but several things are under- or
mis-framed for a learner. This is a content pass (scenario criterion descriptions + the vision
doc + a couple of data-model comments), not engine work. Its most important job is to state the
game's **turnout model** explicitly, which in turn makes the majority-minority criterion
honest without any engine change.

## Current State

- **Turnout is implicit.** `total_population` is treated as the electorate — votes are
  `partyShare × population` and `turnout_rate` is loaded but deliberately unused
  (`adapter.ts:113`). Nothing tells the player this. The intended model (per the project owner):
  *population figures ARE the turned-out voting population; demographic turnout differences are
  assumed folded into those figures.* This is a legitimate simplification for a redistricting
  game (turnout mechanics aren't the lesson) but it must be stated.
- **Majority-minority** (`evaluate.ts:309-324`) uses group *population* share. Under the
  "population = voters" model this is a defensible "share of the voting population → ability to
  elect" operationalization — but the copy should say so, and note that the real legal test
  (VRA / Gingles / Bartlett) is **CVAP** (citizen voting-age population, i.e. eligibility
  measured *before* turnout is known).
- **Compactness** (`evaluate.ts:80-108`) is the cut-edges measure (legitimate; MGGG), not the
  shape-based Polsby-Popper/Reock a player may picture — but it's likely presented as plain
  "compactness."
- **Thresholds** — the EG cutoff (0.10–0.15) and the safe/competitive margins are
  game-calibrated, not canonical (S&M proposed ~0.08); scenario copy implies they're fixed truths.
- **Mean-median** uses the `mean − median` convention (Princeton/DRA); PlanScore uses the
  opposite sign. A curious learner comparing tools would be confused without a note.

## Goals / Acceptance Criteria

- [ ] **Turnout framing** — state, in the vision doc + a data-model comment (and, where a
  scenario surfaces population, its teaching copy) that `total_population` is the turned-out
  voting population with demographic turnout assumed folded in; the game does not model turnout
  separately because it isn't the redistricting lesson.
- [ ] **Majority-minority copy** — the relevant scenario criterion descriptions frame it as
  "share of the voting population" and note the real legal standard is CVAP.
- [ ] **Compactness** — label the criterion as a grid/cut-edges compactness proxy (in its
  criterion description and/or a tooltip); optionally mention Polsby-Popper/Reock exist.
- [ ] **Thresholds** — present the EG and safe/competitive thresholds as game-calibrated in the
  relevant scenario descriptions (not as canonical constants).
- [ ] **Mean-median** — a one-line note (tooltip or scenario copy) on the convention used
  (positive `mean − median` = the party is packed/disadvantaged), since PlanScore is opposite.

## Test Coverage

- Content/copy pass — no logic. Any e2e that asserts specific criterion description text must be
  updated to match; otherwise no test changes.

## References

- Audit: `thoughts/shared/research/2026-06-30-gerrymandering-metrics-audit.compressed.md` (§FINDINGS 2, 3, 4, 5, 7; §RECS 3-5)
- `game/scenarios/*.json` (criterion `description` fields — where most of this copy lives), `thoughts/shared/vision/game-vision.md`, `game/web/src/model/adapter.ts` (turnout comment)
- Related: GAME-112 (engine multiparty + two-party metrics), GAME-114 (rename total_population)
