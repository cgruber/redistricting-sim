---
id: GAME-078
title: VRA scenario implementation — "The 55% Problem" and "The Proxy Problem"
area: game, content
status: open
created: 2026-05-18
---

## Summary

Implement the two VRA-era scenarios designed in DESIGN-013: Scenario A ("The 55% Problem" —
dual failure zone of majority-minority districting) and Scenario B ("The Proxy Problem" —
proxy-based redistricting post-Callais). Both scenarios use terrain features from GAME-075.
They are placed in the Educational campaign after Valle Verde.

## Increment status (2026-07-28)

Delivered in three increments (see the implementation plan,
`thoughts/shared/plans/2026-07-09-game-078-vra-arc.md`):

- **Increment 1 — Scenario A mechanics + dev-draft narrative — LANDING (this PR).** `scenario-010`
  ("Vera County: The 55% Problem"): the multi-group ethnicity pipeline extension, the geometry, the
  four required criteria, the two-witness winnability / over-pack / crack proof (durable unit test +
  e2e), campaign registration after `scenario-005`, and a **dev-draft** narrative carrying the
  DESIGN-014 simplification disclaimers (population-share-not-VAP, compact-is-not-a-safe-harbor). Not
  owner-gated — it is gameplay the traveling owner can test on `dev.pastthepost.gg`.
  - **Deviations flagged for the owner:** (a) Scenario A ships with **no terrain** (`terrain: {}`) —
    a southern-coastal population *shell* forces the compactness/pack tradeoff without terrain
    anchors; (b) the court-struck **starting map fails compactness AND population-balance**, not
    compactness alone (a balanced thin-arm start is not expressible with the available ZoneFilter
    cuts on the sheared disc — see the spec header).
- **Increment 2 — Scenario A final narrative — OWNER-GATED (not this PR).** The both-sides
  value-debate epilogue (guardrail #4) + final prose; DESIGN-014 review gate + owner sign-off before
  any beta exposure.
- **Increment 3 — Scenario B (`scenario-011`) — FUTURE, own plan/PR.** New engine mechanics
  (`hide_race_demographics`, proxy fields, panel + result-reveal). Scenario B boxes below stay
  unchecked for that increment.

## Current State

No scenarios explore VRA compliance tension or post-Callais redistricting. Valle Verde
(scenario-005) introduces `majority_minority` but does not surface the legal conflict between
VRA compliance and the racial gerrymander prohibition.

## Goals / Acceptance Criteria

### Scenario A — "The 55% Problem"

- [x] Map authored — **no terrain**; a southern-coastal population *shell* (Latino share falls off
      inland from the rim) forces the compactness/pack tradeoff without terrain anchors
- [x] Starting map: over-packed thin rim+spur arm fails `compactness` (the court-struck state) —
      **also fails population-balance** (documented deviation; a balanced thin-arm start is not
      ZoneFilter-expressible on the sheared disc)
- [x] `majority_minority` criterion: minority **population share** ≥ 50% (Bartlett 50%+1). NB: the
      engine measures population share, not VAP / can-elect — that framing lives in prose with the
      simplification named (scenario-010 slide "What This Map Can and Can't Show"), not as a mechanic
      claim
- [x] `compactness` criterion: required, tightened to ≥ 0.42 (Valle Verde had 0.35 soft-bonus)
- [x] ~~`county_splits` criterion: optional bonus star~~ — **dropped:** no such criterion type
      exists in the engine (see DESIGN-013 note)
- [x] Intro narrative (slides) — **dev DRAFT**: Bethune-Hill / Gingles / Shaw / Miller / Bartlett
      cited as fact + the "What This Map Can and Can't Show" disclaimer. Both-sides epilogue =
      Increment 2
- [x] Both fail states proven: over-pack wall (arm ≥ 50% but compactness < 0.42) and crack wall
      (community sliced below 50% → `majority_minority` fails). Durable unit test + e2e
- [x] Scenario file authored, generated drift-clean, and registered in the Educational campaign
      after `scenario-005`

### Scenario B — "The Proxy Problem"

- [ ] `hide_race_demographics: boolean` field added to scenario JSON schema + loader
- [ ] Demographic panel respects flag: shows only proxy fields (income, language_minority_pct,
      party lean) when `hide_race_demographics: true`; hides race/ethnicity column
- [ ] Proxy precinct fields added: `income_median: number`, `language_minority_pct: number`
- [ ] `majority_minority` criterion evaluated against underlying (hidden) racial data as normal
- [ ] Result screen: when `hide_race_demographics: true`, reveal race data after evaluation
      ("here's where the minority community actually lived" comparison)
- [ ] Map authored: same region as Scenario A or adjacent; river roughly follows community boundary
- [ ] Intro narrative (slides): post-Callais framing, fictional context
- [ ] Scenario file authored and added to manifest

### Campaign placement

- [ ] Both scenarios added to Educational campaign in CAMPAIGN_REGISTRY
- [ ] Scenario IDs and file names assigned (coordinate with existing 007–009 IDs)
- [ ] Manifest updated; scenario-select and campaign-progress screens reflect new scenarios

## Test Coverage

- [ ] e2e: Scenario A — submit starting map → fails (compactness criterion)
- [ ] e2e: Scenario A — known solution path satisfies majority_minority + compactness
- [ ] e2e: Scenario B — demographic panel does not show race column when flag set
- [ ] e2e: Scenario B — result screen shows race-data reveal section after evaluation
- [ ] e2e: both scenarios appear in Educational campaign scenario select

## References

- DESIGN-013 — scenario design spec (approve before authoring maps)
- GAME-075 / DESIGN-008 — terrain features (implement first; both scenarios use terrain)
- GAME-026 — Valle Verde (group_schema, ethnicity dimension, majority_minority criterion)
- Research: `thoughts/shared/research/2026-05-18-vra-legal-political-landscape.md`
- `game/web/src/store/campaigns.ts` — CAMPAIGN_REGISTRY
