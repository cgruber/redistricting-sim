---
date: 2026-06-30
author: Claude (Opus 4.8) + Christian Jackson-Gruber
ticket: GAME-116
status: approved — ready to implement
---

# GAME-116 — N-party demographics stage: design

## Goal / Context

`pipeline/demographics-stage.ts` `addDemographics` is hardcoded to exactly two parties:
`primaryShare = clamp(zone.party_base[parties[0]] + jitter, 0, 1)`, `secondaryShare = 1 − primaryShare`,
emitting exactly two `vote_shares`. A third party in the spec is ignored. This blocks generating
multiparty scenarios (the GAME-112 3-party `tutorial-005` demo) the "generator = initial state" way.

`DemographicsSpec.parties: string[]` and `ZoneSpec.party_base: Record<string, number>` are already
N-capable at the type level — only the stage's vote-share arithmetic is 2-party.

## The hard constraint drives the model

AC: **regenerating the existing 12 scenarios must produce byte-identical `vote_shares`** (the 2-party
path is the N=2 special case). This forecloses the obvious "assign each party its base, then
renormalize to sum 1" model — renormalization perturbs the 2-party numbers (`(base+jitter)/(1+jitter)`
≠ today's `base+jitter`). The current algorithm is structurally: **the primary party gets
`base + jitter` (clamped); everyone else divides the leftover `(1 − primary)`.** Byte-identity forces
that same shape for N.

## Model (RECORD OF CHOICE): "primary carries the jitter; the rest split the remainder"

Per precinct/zone:
1. `primaryShare = clamp(zone.party_base[parties[0]] + jitter, 0, 1)` — unchanged; the SINGLE seeded
   jitter draw, in the SAME order (before the turnout draw). No new PRNG draws → determinism preserved.
2. `remainder = 1 − primaryShare`.
3. The non-primary parties (`parties[1..]`) split `remainder` by their `party_base` values as **weights**:
   - `weightSum = Σ base[other_i]` (missing → 0).
   - `weightSum > 0` → `share_i = remainder × base_i / weightSum` (unweighted others get 0).
   - `weightSum == 0` → split `remainder` **equally**: `share_i = remainder / others.length`.
4. Emit `vote_shares` over ALL parties (every key present, primary first then spec order).

**N = 2 reduction (byte-identity):** existing specs author only the primary (`party_base: {ken: 0.55}`),
so for the single other party `weightSum == 0` → `ryu = remainder / 1 = (1 − primaryShare) × 1.0`.
IEEE-754 multiply-by-exactly-1.0 is exact, and `1/1 === 1.0`, so this is **bit-identical** to today's
`secondaryShare = 1 − primaryShare`. Same key order → byte-identical JSON.

**Authoring convention (documented in code):** non-primary `party_base` values are weights over the
remainder, not absolute shares. Author all N bases to sum to ~1.0 (with the primary) for the numbers to
be realized literally — e.g. 3-party `{ken: 0.55, ryu: 0.37, ind: 0.08}` yields those shares (± the
primary's jitter, which shrinks/grows the remainder and scales ryu/ind proportionally). The primary
party alone carries the seeded noise.

Properties: shares are each in `[0, remainder] ⊆ [0,1]`; they sum to exactly `primary + remainder = 1`
(no renormalization, no FP drift beyond the single clamp); fully deterministic.

## Scope

- `demographics-stage.ts` `addDemographics` only. No `spec-types.ts` change (already N-capable). No
  assembler change (GAME-043 already carries N parties + `Party.color`).
- Tests (`demographics-stage_test.ts`): add a 3-party zone (three `vote_shares` sum to 1.0, expected
  bases at jitter 0, all keys present); determinism at N=3; keep/extend the 2-party assertions as the
  regression guard. The existing 2-party tests already lock byte-identity (they exercise the N=2 path).
- Empirical byte-identity: the existing determinism tests + the bit-identity proof above are the guard;
  optionally regenerate one spec-yaml scenario and diff to confirm no JSON change.

## Risks

- **Silent behavior drift in the 2-party path** — mitigated by the bit-identity construction (multiply
  by exact 1.0) + the unchanged single-jitter-then-turnout PRNG order + the existing 2-party tests.
- **Author confusion** (weights vs absolute shares) — mitigated by the code comment + this record; the
  weights-sum-to-1 convention makes authored numbers literal.
- **Scope creep** — do NOT touch turnout/eligibility or metrics (GAME-112/113).

## References

- `game/web/src/pipeline/demographics-stage.ts` (`addDemographics`), `spec-types.ts`
  (`DemographicsSpec`, `ZoneSpec`), `demographics-stage_test.ts`
- Related: GAME-112 (multiparty demo needs this), GAME-043 (party-agnostic runtime + `Party.color`),
  GAME-115 (debug campaign to house the demo), GAME-084 (pipeline)
