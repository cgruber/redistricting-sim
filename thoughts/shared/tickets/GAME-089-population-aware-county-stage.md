---
id: GAME-089
title: Population-aware county stage — flood-fill counties that wrap population centers
area: game, tooling
status: open
created: 2026-06-22
---

## Summary

Generate cosmetic county boundaries that follow the population field instead of arbitrary
geometric slices. Today county borders are parallel q/r filters reused from the political
zones, completely decoupled from population, so they don't wrap population centers the way
real US counties do. Replace with a population-aware stage driven by the heuristic from the
county-formation research.

## Current State

Counties are assigned in `demographics-stage.ts` via `county_labels` (geometric q/r filters)
— decoupled from population. `county_id` is **purely cosmetic**: it drives only the dashed
county-border overlay (`mapRenderer.ts`); it does NOT affect contiguity, scoring, or
districting. So this stage can be reshaped freely without gameplay risk.

## Design (from research)

Single algorithm — seeded priority-queue flood-fill — parametrized by a **named `model`
preset** (intuit-on-sight names; the owner reasons in real-city examples, not raw knobs —
see [[feedback-plain-english-tooling-knobs]]). Full spec + plain-English mapping +
principles in `thoughts/shared/research/2026-06-22-us-county-formation-patterns.md`
§RECOMMENDED_HEURISTIC.

```
STEP0 target count ≈ precincts / 14   (R5→~6, tutorial→~2); knob = catchment radius r=2
STEP1 classify centers by catchment pop (Σ within r, nearest-center wins):
        dominant ≥40% Ptot | anchor ≥15–20% Ptot | minor <15% (absorbed into nearest)
        always keep ≥1 anchor; cap anchors to target (top-k by catch pop)
        → ONE county may hold SEVERAL towns (Clark County WA case): minors are absorbed
STEP2 grow: 1 seed per anchor peak; pop-lowest-cost frontier; assign; push neighbours
        cost = 1 + w_trough*(1 - norm_pop_neighbor) + w_feature*crosses_feature
        (w_trough≈0.5, w_feature≈1.0); fill all; orphans → nearest seat by hex dist
STEP3 named model preset:
        "seat_and_hinterland" (default, Pattern B): done — each anchor = a seat + surround
        "city_county" (Pattern A, SF/Denver): for each dominant center, carve urban-core
            (pop ≥ core_density*peak, default 0.5) + split remainder into `ring_counties`
            counties (default auto; scenario-002 = 2: west + east)
        "split_metro" (Pattern C, Portland): split_dense_center=true → multiple seeds
            inside one large center so county lines cut through the city
```

**Principles (must hold):** counties are UNEQUAL by design (target count = #seeds only,
never balances them; sanity is local, not global); the REGION CLIPS counties (edge
counties truncated by the map boundary is expected — a game simplification, not a bug);
satellite towns (Vancouver-WA-like, same state) are just extra settlement centers, not a
model. county_id stays cosmetic-only.

## Goals / Acceptance Criteria

- [ ] New county stage runs AFTER population (reads the field); replaces the geometric
      `county_labels` path
- [ ] Spec gains a `counties:` block: `model` (seat_and_hinterland | city_county |
      split_metro) + optional overrides (r, anchor%, dominant%, core_density, ring_counties,
      split_dense_center, weights), each with an inline plain-English + real-city comment
- [ ] All three presets produce contiguous, compact counties that wrap population center(s)
- [ ] Borders prefer population troughs + river/feature edges (soft bias, never a barrier)
- [ ] All thresholds spec-overridable with documented defaults
- [ ] Plain-English → preset mapping table kept current in the research doc (breadcrumb)
- [ ] scenario-002 migrated to the `counties:` block; old `county_labels` path removed
- [ ] county_id remains cosmetic-only (no gameplay coupling introduced)

## Test Coverage

- [ ] Unit tests: center classification, flood-fill contiguity, orphan reassignment, all
      three model presets (incl. multi-town absorption), threshold overrides
- [ ] Manual: scenario-002 county overlay reads as sane in both models

## References

- Plan: `thoughts/shared/plans/2026-06-22-generation-quality-overhaul.md`
- Research: `thoughts/shared/research/2026-06-22-us-county-formation-patterns.md`
- `game/web/src/pipeline/demographics-stage.ts` (current county_labels path),
  `pipeline-runner.ts`, `assembler.ts`
- `game/web/src/render/mapRenderer.ts` (cosmetic overlay consumer)
- Depends on GAME-088 (consumes the improved population field)
