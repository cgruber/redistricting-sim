---
id: GAME-104
title: Single-source domain constants — tie-break, party set, party colors, district palette
area: game, code-quality, correctness
status: open
created: 2026-06-27
---

## Summary

Core domain constants are redefined in multiple disconnected places and have already drifted;
most seriously, the **tie-break direction is inconsistent** between the simulated winner and
the displayed winner — a user-visible contradiction in a game about who-wins-where. Establish
single sources of truth. From the 2026-06-27 quality review (top-10 #7, Theme 5).

## Current State

- **Tie-break contradiction:** `pluralityWinner` (`election.ts:25-33`) keeps `best` only on
  strict `>`, so an exact R/D tie resolves to **R** (first in `ALL_PARTIES`). The adapter's
  displayed winner (`adapter.ts:126`) is `partyShare.D >= partyShare.R ? "D" : "R"` — a tie
  resolves to **D**. Both rules are cemented by opposing tests (`adapter_test.ts:162` says D
  wins, `evaluate_test.ts:210` says R wins). Exact ties are reachable (shares round to 3
  decimals; balanced scenarios push toward 50/50).
- **Party set duplicated 5+ places** (`election.ts:17` `ALL_PARTIES`, `zeroShare()`,
  `main.ts:572` `SPIKE_PARTY_KEYS`, inline `['D','R','L','G','I']` at `mapRenderer.ts:1137`
  with **D,R inverted**, and the `types.ts` key sets). An array literal omitting a party
  type-checks but silently drops it from winner/margin math.
- **`PARTY_COLORS` hex re-hardcoded** in `styles.css:420` (`#7b35a8`/`#c96d00`) vs the
  authoritative `types.ts:171-173`; changing the TS palette leaves the vote-bar stale.
- **District-color fallback diverges** (`#2a2a3e` at `mapRenderer.ts:1259,1281` vs `#888` in
  `panels.ts`), with no `MAX_DISTRICTS` guard; the map fallback is also the unassigned-fill
  color, so a 6th district would read as "unassigned."

## Goals / Acceptance Criteria

- [ ] Extract one `winnerOf(share)` (or `topParty`) helper used by both `election.ts` and `adapter.ts`; pick and document one canonical tie-break rule (incl. ordering for L/G/I); reconcile the two contradictory test assertions.
- [ ] Export `ALL_PARTIES: readonly PartyKey[]` and derive `PartyKey = typeof ALL_PARTIES[number]` from `types.ts`; import everywhere; remove the inline literals (incl. the inverted one at `mapRenderer.ts:1137`).
- [ ] Drive party colors from TS: set CSS custom properties (`--party-d`, `--party-r`) once at init from `PARTY_COLORS` and use `var(...)` in the `.vote-bar` gradient (or build the gradient in `panels.ts` where `PARTY_COLORS` is in scope).
- [ ] Add `districtColor(id)` in `types.ts` with one agreed fallback used everywhere; define `MAX_DISTRICTS = DISTRICT_COLORS.length` and reject `districts.length > MAX_DISTRICTS` at load (fail loud instead of split colors).

## Test Coverage

- [ ] `election`/`adapter` agree on the winner for an exact R/D tie (one shared rule) — replaces the contradictory assertions.
- [ ] A test asserts no party is dropped: deriving winner over `ALL_PARTIES` covers all five keys.
- [ ] Loader rejects `districts.length > MAX_DISTRICTS`.

## References

- Review: `thoughts/shared/research/2026-06-27-codebase-quality-review.md` (Theme 5; Sim finding "tie-break")
- `game/web/src/simulation/election.ts`, `game/web/src/model/adapter.ts`, `game/web/src/model/types.ts`, `game/web/src/render/mapRenderer.ts`, `game/web/styles.css`
- Related: GAME-043 (unify spike/scenario type systems — coordinate `types.ts` changes)
