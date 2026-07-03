---
id: GAME-118
title: Home-base independent candidates (on the ballot in one district)
area: game, model, simulation, UX
status: open
created: 2026-07-02
---

## Summary

Model an **independent** as a candidate on the ballot in exactly **one** district — the one containing
their **home** — who can win **at most that one seat**. A party fields a candidate in every district;
an independent runs where they live. This is opt-in per scenario (no independent → today's behavior).
Design of record: `thoughts/shared/plans/2026-07-02-district-candidates-and-independents.md`.

## Current State

- GAME-112 shipped third-party support where a "party" contests every district and can win multiple
  seats. An independent authored as a party (the tutorial-005 draft's Dhalsim) wrongly behaves the same
  — he could win any district he leads, and is "on the ballot" everywhere.
- `election.ts` computes each district's winner as the plurality over all `parties` (GAME-043 runtime).
- The two-party metric normalization (GAME-112 PR1) already restricts EG/mean-median to the two majors.

## Goals / Acceptance Criteria

- [ ] A party may be flagged `independent: true` with a **home** (precinct id or coordinate → precinct).
      Additive/optional; scenarios without one are unchanged.
- [ ] Election: in the district containing the home, the independent is on the ballot (winner =
      plurality over parties **+** independent); in every other district the independent is **excluded
      from the seat contest** (winner = plurality over the parties only). An independent wins ≤ 1 seat.
- [ ] The lean map is UNCHANGED (independent shows map-wide — lean ≠ ballot); a **home pin** (`⌂ name`)
      marks the home precinct; non-home districts' result/info convey the party-only contest.
- [ ] Builds on GAME-117 (the independent is a candidate that exists in one district).
- [ ] Confirm the two-party metrics stay correct with an independent present (they exclude non-majors);
      cover the home-district independent-WIN branch flagged untested in GAME-112 PR1.
- [ ] **Vote status outside home (decided in the #324 review):** the independent's share in a non-home
      district is **disregarded for the seat** — winner = plurality among the parties as-is; no
      redistribution to a major (second preferences aren't modeled). Precinct vote shares are unchanged;
      only the seat contest excludes him.
- [ ] **Multiplicity:** support **zero or more** independents, each with its own home; each is on the
      ballot only in its home district (no global single-independent assumption).
- [ ] **Unassigned home:** if the home precinct is unassigned (mid-draw), the independent is on no
      ballot and becomes a contender once his home is placed in a district — falls out of the rule,
      no special-case error.

## Test Coverage

- [ ] Election test: independent wins the home district when it holds his base; is excluded elsewhere
      (a non-home district he'd "lead" on lean goes to the leading party); wins ≤ 1 seat.
- [ ] Cracking/packing: home drawn into a hostile district → independent loses; base kept together →
      wins. Deterministic.
- [ ] Metrics unaffected by the independent's presence (regression vs. a no-independent baseline).

## References

- Design: `thoughts/shared/plans/2026-07-02-district-candidates-and-independents.compressed.md`
- `model/scenario.ts`, `model/loader.ts`, `simulation/election.ts`, `simulation/evaluate.ts`,
  `render/mapRenderer.ts` (home pin)
- Depends: GAME-117. Feeds: GAME-121 (independent tutorial)
