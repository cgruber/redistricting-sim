---
id: GAME-119
title: Feature-anchored zone filters (leans on geography, not q-bands)
area: game, tooling
status: open
created: 2026-07-02
---

## Summary

The demographics stage's zone filters only support `q_lte` / `q_gte` / `hex_dist_lte` (distance from
the ORIGIN), which forces artificial vertical q-bands for partisan leans. Add **proximity filters** so
a scenario can hang leans on real geography — the urban core, the smaller city, riverside, rural —
matching how support actually clusters. Also carry T4's polished terrain into the tutorial-005 map so
the tutorial set reads as a visual progression. Design of record:
`thoughts/shared/plans/2026-07-02-district-candidates-and-independents.md`.

## Current State

- `pipeline/spec-types.ts` `ZoneFilter` = `{ q_lte?, q_gte?, hex_dist_lte?, default? }`; `hex_dist_lte`
  is distance from (0,0) only. `demographics-stage.ts` `matchesFilter` ANDs those conditions.
- Settlements sit at known anchors (center/east/west with radii); the river path is known coordinates —
  so feature proximity is computable, the filter just can't express it.

## Goals / Acceptance Criteria

- [ ] Add proximity filter key(s): at minimum `near: { q, r }` + `within: N` (hex distance to an
      arbitrary point), and optionally `near_river` / `near_feature` (distance to a routed feature).
      Additive/optional; existing specs with only q-filters regenerate byte-identically.
- [ ] `matchesFilter` honors the new key(s), ANDed with the others; first-match-wins preserved.
- [ ] Deterministic (no new PRNG draws); documented in the spec-types + a demographics-stage comment.
- [ ] (Optional, coordinate with GAME-120) carry T4's terrain treatment into the tutorial-005 map.

## Test Coverage

- [ ] `demographics-stage_test.ts`: a `near`/`within` zone selects the expected precincts (boundary at
      distance N in / N+1 out); ANDed with q-conditions; existing q-band specs unchanged (regression).
- [ ] Regenerating a current spec (no proximity filters) yields byte-identical output.

## References

- Design: `thoughts/shared/plans/2026-07-02-district-candidates-and-independents.compressed.md`
- `pipeline/spec-types.ts`, `pipeline/demographics-stage.ts` (`matchesFilter`), `demographics-stage_test.ts`
- Feeds: GAME-120 (multi-party tutorial), GAME-121 (independent tutorial). Related: GAME-100 (terrain), GAME-116
