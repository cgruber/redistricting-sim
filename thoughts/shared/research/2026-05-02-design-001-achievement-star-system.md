---
date: 2026-05-02
ticket: DESIGN-001
status: accepted
researcher: agent
---

# Achievement / Star-Ranking System Design

## Research Summary

The dominant star-ranking pattern in puzzle games originates with Angry Birds (2009), which introduced a 0–3 star system awarded after each level based on a single score threshold. Before that release, roughly 20% of mobile games used a star rating; afterward the figure approached 80%. Cut the Rope adopted the same shape: three collectible stars per level, always exactly three possible, always on the same axis as the core challenge (collect the candy, collect the stars). Both games work well because the optional objectives are *on the same performance axis* as the required objective — the player does the same thing, just more efficiently or completely.

Monument Valley stands as the deliberate counterpoint: no stars, no score, no rating. The experience is the reward. This is appropriate for a narrative art puzzle but would undermine an educational game that has explicit learning objectives players need feedback on. Zachtronics games (SpaceChem, Opus Magnum, Infinifactory) take a third path: multi-metric histograms comparing cycles, cost, and space against global leaderboards. This works because their solutions are genuinely open-ended on continuous axes with real trade-offs between metrics. It does not translate to Past the Post — success criteria here are boolean (a district plan either achieves majority-minority representation or it does not), not continuous optimization scores.

Educational games show a different pattern still. Khan Academy and Duolingo treat completion as binary and track optional mastery through separate mechanisms — practice streaks, XP, badge milestones. Neither uses per-exercise star counts. Research on achievement design (Blair, Game Developer) identifies *measurement achievements* (variable stars based on performance level) as pedagogically superior to *completion achievements* (binary pass/fail) because they give players calibrated feedback that increases reflection and intrinsic motivation. The design literature further recommends that achievements in educational contexts "focus the player's attention on important lessons or strategies" rather than creating artificial incentives — which argues against a fixed 3-star system that implies a predetermined hierarchy of optional objectives.

## Candidate Model Evaluation

**Model A — Fixed 3-tier stars (1★ required; 2★ required + some optional; 3★ all optional):**
The "some optional" definition is underspecified when scenario optional-criterion counts vary. With one optional criterion, 2★ and 3★ collapse. With five, the boundary between 2★ and 3★ is arbitrary. Enforcing fixed-3 requires adding `weight` or `tier` metadata to `SuccessCriterion` to distinguish which optional criteria count toward which tier — a format change that adds complexity without educational benefit. More importantly, it implies a ranking among optional objectives (achieving compactness is "better" than achieving partisan fairness), which is precisely the misrepresentation Past the Post should avoid. Rejected.

**Model B — N/M campaign stars with freeform per-scenario counts:**
This is the correct shape for campaign-level progress tracking ("34 of 47 stars"), but it says nothing about *within-scenario* structure. It is a consequence of a good per-scenario model, not itself a model. Compatible with the recommendation below.

**Model C — Per-criterion achievements, no aggregate rank:**
Treats each optional criterion as a completely independent badge. No star count, no campaign aggregate. This is educationally accurate but removes the campaign-level progress hook that motivates replay. Players need some sense of "how complete am I overall?" Pure per-criterion badges with no aggregate can feel diffuse on a scenario select screen. Partially adopted in the recommendation below, but with an aggregate layer added.

## Recommendation: Variable Per-Criterion Stars

Build the following system:

- **1 base star** awarded when all `required: true` criteria are met (scenario complete).
- **1 additional star per `required: false` criterion** that the player achieves.
- A scenario with N optional criteria has N+1 possible stars.
- **Campaign progress** = total stars earned / total stars available across all scenarios.
- The scenario select screen shows per-scenario star counts inline (e.g., ★★★☆ on a 3-optional scenario).
- The campaign screen shows aggregate progress (e.g., "34 of 47 stars").

This is the right model for Past the Post for three reasons. First, it requires **no format change** — `required: boolean` on `SuccessCriterion` already encodes everything. Second, it makes each optional criterion an independent pedagogical learning beat rather than a tier in a predetermined hierarchy. Compactness and partisan fairness are not ranked against each other; achieving either is equally meaningful. Third, it provides the campaign-level feedback hook (total stars) that sustains replay motivation across scenarios without imposing false ordering within a scenario.

**Steam achievements** are a separate layer. Steam achievements are campaign-scoped milestones ("complete all tutorial scenarios," "earn 10 majority-minority stars," "achieve all stars on the first campaign") mapped manually by scenario authors to the Steamworks achievement API. They are not 1:1 with per-scenario optional criteria. The in-game star model and the Steam achievement model are independent; do not let the Steam 100-achievement cap constrain per-scenario star design.

## Minimal Format Change Required

**None.** The recommendation is fully implementable with the current `SuccessCriterion` schema. The engine counts:

```
base_stars  = 1 if all required criteria pass else 0
bonus_stars = count(optional criteria that pass)
total       = base_stars + bonus_stars
max         = 1 + count(optional criteria)
```

No new fields on `SuccessCriterion`. No `weight`, `tier`, or `star_value`. Scenario authors control per-scenario star counts by adding or removing `required: false` criteria.

The only new data is in **player save state** (not scenario format): store `criteria_passed: Set<CriterionId>` per scenario attempt, from which stars are derived at render time.
