---
id: GAME-112
title: Multiparty support in the adapter + two-party-normalized fairness metrics
area: game, simulation, architecture
status: open
created: 2026-06-30
---

## Summary

The engine can already model up to five parties, but the adapter throws that away: it maps
`scenario.parties[0] → R` and `parties[1] → D` positionally and drops every party after the
first two. We want third parties to actually appear in elections. AND — once third-party vote
share can be nonzero — the efficiency-gap and mean-median criteria must be computed on the
**two-party** vote, or a minor party silently corrupts both fairness metrics. These are one
workstream: enabling third parties without fixing the metrics would ship wrong numbers.

Sourced from the 2026-06-30 metrics audit (`thoughts/shared/research/2026-06-30-gerrymandering-metrics-audit.md`).

## Current State

> **Post-GAME-043 update (2026-06-30):** GAME-043 PR 1 (#318) landed the party-agnostic runtime,
> so the "Current State" below is largely superseded — `model/types.ts`, the `R/D/L/G/I` slots,
> `ALL_PARTIES`, and `partyIdToKey` no longer exist. The adapter (`scenarioToRuntime`) now already
> aggregates **all** scenario parties pop-weighted; the remaining 112 work is (a) a multiparty
> *scenario/fixture* to exercise it and (b) two-party-normalizing efficiency-gap / mean-median
> (still hardcoded to `parties[0]/[1]`). Rework this section when implementing.
>
> **Display-string finding (PR #318 critique):** `evaluate.ts` criterion `detail` strings now
> interpolate the raw scenario party-id (e.g. `ken-disadvantaged`) rather than a display name.
> Lateral to the old raw `R`/`D` key — not a regression — but when metrics go multiparty these
> should use the scenario's authored party *name*/abbreviation. Coordinate with GAME-113.
>
> **PR 1 of 2 done (#322) — the metrics half:** efficiency-gap + mean-median are now
> two-party-normalized (win line = half the two-party vote; denominator = Σ two-party votes; mean-
> median on `c.party/(party1+party2)` shares), byte-identical at third-party-share 0. 3-party
> `evaluate_test` fixtures pin the normalized values (EG 0.083 not the old 0.10; mean-median 0.083
> not the old 0.067). **Remaining for PR 2 (collaborative):** the 3-party `tutorial-005` demo
> scenario (generated via GAME-116's N-party stage, housed in GAME-115's debug campaign, eyeballed
> on serve-local) + a 3-party *adapter* test (nonzero third-party share; a district a third party
> wins). Also fold in the `buildContinueUrl` gating-symmetry note from the #321 critique once the
> debug scenario is actually playable.

- `adapter.ts:113-129`: reads only `firstPartyId = parties[0].id` (→ R) and
  `secondPartyId = parties[1].id` (→ D), sums each demographic group's
  `population_share × vote_shares[thatId]`, and hardcodes `L: 0, G: 0, I: 0`. Third+ parties
  in a scenario's `vote_shares` are ignored. This is a spike-era shortcut, not a real limit.
- The runtime `PartyShare` type (`model/types.ts`) already has 5 slots (`R,D,L,G,I`).
- The engine (`simulation/election.ts`) already iterates `ALL_PARTIES` for the plurality
  winner, margins, and `seatsByParty` — it is already multiparty-capable; it just receives
  zeros for L/G/I.
- `main.ts`'s `partyIdToKey` maps scenario party ids → runtime keys but currently only for the
  first two.
- **Metrics (`evaluate.ts`):** the efficiency gap (`251-281`) uses a denominator of *all* votes
  and a `V_total × 0.5` win line; mean-median (`283-307`) uses each district's *raw* share.
  Both are correct only when third-party share is exactly 0 (true today, precisely because the
  adapter zeroes L/G/I). See the audit for the two failure modes under nonzero minor parties.
- **Relationship to GAME-043** (unify spike/scenario type systems; retire `adapter.ts`): the
  positional two-party mapping is exactly the spike layer GAME-043 targets. Decide whether to
  do the minimal fix here or fold this into GAME-043.

## Goals / Acceptance Criteria

- [ ] Decide the scope (record the choice):
  - **Minimal:** map up to 5 scenario parties onto the existing `R/D/L/G/I` slots (no type
    change) — extend the adapter's positional mapping + `partyIdToKey` to all parties, keep the
    fixed 5-key `PartyShare`.
  - **Proper (prefer, coordinate with GAME-043):** make the runtime party-agnostic (arbitrary
    party ids, real names), retiring the `R/D/L/G/I` spike keys and the adapter spike layer.
- [ ] The adapter populates every scenario party (not just the first two); a scenario with an
  L/G/I-style third party produces nonzero third-party vote share, and the election
  (`winner`, `margin`, `seatsByParty`) reflects it (a third party can win a district).
- [ ] **Two-party-normalize the fairness metrics** so they stay correct with third parties:
  efficiency gap and mean-median compute on the top-two (or R+D) vote per district — winner
  surplus over *half the two-party total*, wasted votes and denominators restricted to the two
  major parties. Document the two-party assumption in the metric comments.
- [ ] No behavioral change for existing (strictly two-party) scenarios — EG/mean-median values
  are identical when third-party share is 0.

## Test Coverage

- [ ] Adapter test: a scenario/precinct fixture with three+ parties yields nonzero third-party
  `partyShare`, and a district where a third party has plurality reports that winner.
- [ ] `evaluate_test.ts`: EG and mean-median on a fixture WITH nonzero third-party votes match
  the hand-computed two-party values (and are unchanged vs. the current output when third-party
  share is 0 — a regression guard).

## References

- Audit: `thoughts/shared/research/2026-06-30-gerrymandering-metrics-audit.compressed.md` (§FINDINGS 1, 2, 7)
- `game/web/src/model/adapter.ts`, `game/web/src/model/types.ts`, `game/web/src/simulation/election.ts`, `game/web/src/simulation/evaluate.ts`, `game/web/src/main.ts`
- Related: **GAME-043** (unify spike/scenario type systems — this may subsume the adapter half), GAME-113 (framing copy)
