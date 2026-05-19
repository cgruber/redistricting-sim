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

## Current State

No scenarios explore VRA compliance tension or post-Callais redistricting. Valle Verde
(scenario-006) introduces `majority_minority` but does not surface the legal conflict between
VRA compliance and the racial gerrymander prohibition.

## Goals / Acceptance Criteria

### Scenario A — "The 55% Problem"

- [ ] Map authored: coastal or riverine terrain (GAME-075), realistic population gradient,
      minority community concentrated in urban cluster
- [ ] Starting map: high-BVAP configuration that fails `compactness` (the "illegal 55% floor" state)
- [ ] `majority_minority` criterion: functional threshold (minority voters can elect preferred candidate)
- [ ] `compactness` criterion: required, tightened threshold
- [ ] `county_splits` criterion: optional bonus star
- [ ] Intro narrative (slides): Virginia Bethune-Hill pattern, fictional names and places
- [ ] Both fail states reachable: low BVAP (VRA fail) and fragmented district (compactness fail)
- [ ] Scenario file authored and added to manifest

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
