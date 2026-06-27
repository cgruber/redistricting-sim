---
id: GAME-102
title: De-duplicate the loader's dual scenario-validation passes
area: game, code-quality, architecture
status: open
created: 2026-06-27
---

## Summary

`loader.ts` (the single most safety-critical file — it gates every scenario the game loads)
implements the scenario invariants **twice**, in two functions that both run on every
production load and can silently drift. Consolidate them. From the 2026-06-27 quality review
(top-10 #9, highest structural risk).

## Current State

`loadScenario = validateScenarioComplete(parseScenario(json))` (`loader.ts:1628`), so both
validators run on every load:
- `validateStructural` (`loader.ts:1115-1471`) — parse-time, partial data, every check guarded `if (x !== undefined)`.
- `validateScenarioInvariants` (`loader.ts:538-937`) — post-completeness, complete data.

Both re-implement id-uniqueness, vote-share sums, party refs, group_schema
completeness/cartesian-product, terrain mountain-enclosure (BFS flood-fill), and river-edge
geometric-adjacency. The terrain/river blocks (`807-936` vs `1366-1470`) are **near
byte-identical** (hand-verified during the review — same error strings, same BFS bounds
`-2/+2`, same neighbor clamping; differ only in the `demographic_groups !== undefined`
guard and cosmetic line collapsing). A rule changed in one copy diverges the parse-time and
gameplay paths, with no test catching it.

## Goals / Acceptance Criteria

- [ ] Decide and document the approach (record an ADR if non-obvious):
  - **Option A (incremental, lower-risk):** extract parameterized predicates — `checkUniqueIds`, `checkVoteShareSums(fields, {requireGroups})`, `validateTerrain(precincts, terrain_tiles, river_edges)` — called by both entry points (structural with partial guards, complete after the gate). Keeps the partial/complete split.
  - **Option B (deeper, preferred if the loader keeps growing):** parse → **normalize** (fill optionals with explicit defaults / narrow unions at parse time) → validate **once** over the normalized model; the "complete" path and the byte-identical terrain blocks disappear. (This is the grok-4 second-opinion recommendation — the two-pass design only buys earlier structural errors + missing-vs-bad-value distinction, which doesn't justify the maintenance cost.)
- [ ] The two terrain/river blocks (`807-936`, `1366-1470`) collapse to a single implementation.
- [ ] No behavioral change to accept/reject decisions or error messages for currently-shipped scenarios.

## Test Coverage

- [ ] A test feeds a full fixture through both `parseScenario` and `validateScenarioComplete` (Option A) — or the single pass (Option B) — and asserts identical accept/reject and matching error prefixes.
- [ ] Existing `loader_test.ts` / `loader_parse_test.ts` / `loader_integration_test.ts` stay green.
- [ ] Add a regression test for at least one invariant per category (uniqueness, vote-share sum, terrain enclosure, river adjacency) so a future single-copy edit can't silently pass.

## References

- Review: `thoughts/shared/research/2026-06-27-codebase-quality-review.md` (Theme 1; External second opinion)
- `game/web/src/model/loader.ts`, `game/web/src/model/adapter.ts`, `game/web/src/model/runtime-types.ts`
- Related: GAME-084 (pipeline; "requires loader validation split"), GAME-101 (`requireNumber`)
