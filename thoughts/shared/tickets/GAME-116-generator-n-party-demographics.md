---
id: GAME-116
title: Extend the generator's demographics stage to N parties
area: game, tooling
status: open
created: 2026-06-30
---

## Summary

The map-generation pipeline's demographics stage is hardcoded to exactly two parties, so a
scenario spec can't produce three-party vote shares. Extend it to N parties, so multiparty
scenarios (e.g. the 3-party `tutorial-005` demo for GAME-112) can be generated the
"generator = initial state" way rather than hand-authored.

## Current State

- `pipeline/demographics-stage.ts:19-59` (`addDemographics`): reads `primaryParty = spec.parties[0]`,
  `secondaryParty = spec.parties[1]`, computes `primaryShare = base + jitter` and
  `secondaryShare = 1 − primaryShare`, and emits exactly two `vote_shares`. A third party in the
  spec is ignored.
- Zone specs carry `party_base: Record<PartyId, number>` (e.g. `{ ken: 0.62 }`), currently only the
  primary party's base is read.

## Goals / Acceptance Criteria

- [ ] `addDemographics` supports `spec.parties` of length ≥ 2. Per zone, `party_base` may specify
      base shares for multiple parties; the stage produces a `vote_shares` map over ALL parties that
      sums to 1.0, with jitter applied deterministically (seeded PRNG) and shares clamped to [0,1].
- [ ] Define the N-party model clearly (record the choice): e.g. specified bases are honored, the
      unspecified remainder is distributed (equally, or to a designated "rest" party), jitter applied
      to the primary then renormalized. Must remain deterministic (same seed → same output).
- [ ] Behavior-preserving for existing 2-party specs: regenerating the current 12 scenarios yields
      byte-identical `vote_shares` (the two-party path is the N=2 special case).
- [ ] `spec-types.ts` and the assembler pass N parties through (coordinate with GAME-043's
      `Party.color` addition to `assembly.parties`).

## Test Coverage

- [ ] `demographics-stage_test.ts`: a 3-party zone spec produces three vote_shares summing to 1.0
      with the expected bases; determinism (same seed twice → identical); and the 2-party path is
      unchanged (regression).
- [ ] Regenerating a current 2-party scenario produces identical JSON.

## References

- `game/web/src/pipeline/demographics-stage.ts`, `game/web/src/pipeline/spec-types.ts`, `game/web/src/pipeline/assembler.ts`
- Related: GAME-112 (multiparty — its demo scenario needs this), GAME-043, GAME-084 (pipeline), GAME-090 (settlement density)
