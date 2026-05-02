---
id: GAME-057
title: Per-session scenario randomization (population and lean offsets)
area: game, content, replayability
status: open
created: 2026-05-02
---

## Summary

Add optional per-session randomization to scenarios — small offsets to precinct
population and partisan lean (±5% from scenario base values), seeded per session.
This eliminates the "one true map" problem identified in the gameplay critique
(GAME-031) and encourages replay by making each session subtly different.

E2e tests remain deterministic: test scenarios pin to base values (seed=0 or no
randomization flag), so the random path is exercised only by new unit tests.

## Current State

Scenarios are fully deterministic: precinct population and partisan lean are
fixed values from the JSON. Replaying a scenario with the same strategy always
produces the same result. Identified as a weakness in the gameplay critique
(2026-04-27-gameplay-critique.md, recommendation #2).

## Goals / Acceptance Criteria

- [ ] Scenario generator (or loader) supports an optional `seed` parameter that
      applies consistent ±5% offsets to precinct population and partyShare values
- [ ] Randomization is per-session: same seed → same map; new session → new seed
- [ ] Scenarios opt in via a JSON flag (`randomizable: true`) or generator flag;
      tutorial scenarios default to non-randomized (determinism for learning)
- [ ] All existing e2e tests continue to pass unmodified (tests use base/deterministic values)
- [ ] New unit tests cover: seed reproducibility, offset bounds (never <0 or >1 for shares),
      population totals remain positive

## References

- `thoughts/shared/research/2026-04-27-gameplay-critique.md` — recommendation #2
- `game/web/src/model/scenario.ts` — scenario loading
- `game/scenarios/` — scenario JSON files
- GAME-031 — gameplay critique followup (parent)
