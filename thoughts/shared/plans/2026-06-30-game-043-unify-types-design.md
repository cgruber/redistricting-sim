---
date: 2026-06-30
author: Claude (Opus 4.8) + Christian Jackson-Gruber
ticket: GAME-043
status: approved 2026-06-30 (decisions resolved below) — ready to implement
---

# GAME-043 — Unify the type systems: design

## Goal / Context

The codebase runs on **two parallel type systems**:
- `model/scenario.ts` — canonical, party-agnostic (`Party.id: PartyId` arbitrary strings;
  `DemographicGroup.vote_shares: Record<PartyId, number>`; string `PrecinctId`).
- `model/types.ts` — the **spike** runtime (`PartyShare {R,D,L,G,I}` fixed keys; numeric precinct
  ids; pre-computed `center`, `neighbors`, `partyShare`, dummy `demographics`).

`adapter.ts` translates scenario→spike at load, positionally mapping `parties[0]→R, parties[1]→D`
and **dropping every party after the first two**. All simulation + render code
(`election.ts`, `validity.ts`, `evaluate.ts`, `mapRenderer.ts`, `panels.ts`, `gameStore.ts`)
operates on the spike types.

This ticket retires the split: one unified runtime model, party-agnostic, so **multiparty
(GAME-112) falls out** instead of being bolted onto the fixed keys twice.

**Behavior-preserving.** All 12 shipped scenarios are strictly two-party (ken/ryu, cat/dog), so a
party-agnostic model that aggregates *all* parties produces identical results today. The existing
39→47 tests are the regression guard (GAME-043's AC: no behavior change).

## The crux: party representation

Retire the fixed `PartyKey = "R"|"D"|"L"|"G"|"I"` and `PartyShare {R,D,L,G,I}`. Replace with
**party shares keyed by the scenario's `PartyId`** — which the canonical model already uses.

Proposed:
- `PartyShare` → `Record<PartyId, number>` (or a `Map<PartyId, number>`; recommend a plain object
  keyed by PartyId for JSON/serialization ease and zundo snapshots). Every party present, sums to 1.
- `winnerOf(share, parties: PartyId[])` — takes the ordered party list instead of the global
  `ALL_PARTIES`; tie-break = first in the scenario's `parties` order (preserves the current
  deterministic rule, just sourced from the scenario rather than R>D>L>G>I).
- `DistrictResult.winner: PartyId`, `voteTotals: Record<PartyId, number>`,
  `SimulationResult.seatsByParty: Record<PartyId, number>`.
- `PreviousResult.winner: PartyId`.

### Party colors/labels — DECIDED: (B) scenario-authored
Add `color?: string` (hex) to `Party` in `scenario.ts`, authored per party. A palette
(`PARTY_PALETTE: string[]` = the current 5 hexes, indexed by party order) remains the **fallback**
when a party omits `color`, so the field is optional in the type and nothing breaks — but every
shipped scenario authors it. Preserve today's look: ken/parties[0] = the current orange, ryu/
parties[1] = the current purple.

Scope note (accepted): scenarios are pipeline-generated, so this means adding `color` to the
`assembly.parties` spec entries (+ the assembler + spec-types), and regenerating (or hand-editing)
all 12 scenario JSONs. The loader validates `color` as a string when present.

The `--party-d`/`--party-r` CSS custom props (`main.ts:247`) become per-party, sourced from each
party's resolved color (authored, else palette fallback).

## The unified Precinct

One `RuntimePrecinct` (extend `scenario.Precinct` or a new `model/runtime.ts` — recommend a
dedicated `runtime.ts` so the file boundary is clean), built once at load. Keep the **numeric
runtime index** — it's load-bearing in `AssignmentMap<number>`, BFS contiguity, keyboard nav, and
WIP save/restore; migrating to string ids is a much larger, riskier change out of scope here. So
the runtime precinct carries both the canonical `PrecinctId` (string) and a numeric `index`.

Runtime precinct fields (from the current spike Precinct, minus cruft):
`index` (number), `scenarioId` (PrecinctId), `name?`, `county_id?`, `county_name?`, `coord`,
`center`, `neighbors` (numeric), `passableNeighbors?`, `terrainAnnotation?`, `population`,
`voteShare: Record<PartyId, number>`, `previousResult`, `groupShares?`. **Drop the dummy
`demographics {male,female,nonbinary}`** field (unused; GAME-043 AC).

## `adapter.ts` → a builder (not a translator)

`adapter.ts` stays as the **load-time builder** that produces the unified type — but it's no longer
a bridge between two type *systems*, just derivation (hex geometry, neighbor indices, terrain
annotations, vote aggregation, previousResult). Per the AC this is "reduced to a trivial load-time
parse with no structural translation." Rename to `runtime-builder.ts` (or keep `adapter.ts` with a
comment). It will:
- aggregate **all** parties: `voteShare[party.id] = Σ group.population_share × group.vote_shares[party.id]`
  over every scenario party (behavior-preserving today; the multiparty enablement for GAME-112).
  *Note: GAME-043 keeps the current population-weighted aggregation; turnout/eligibility stay
  unused (that's GAME-112/113).*

## Consumer migration (from the full usage map)

The hard-coded `.R`/`.D` sites that MUST change (the rest is mechanical key-swaps):
- `adapter.ts:140` — `partyShare.D − partyShare.R` margin → margin vs. actual runner-up (sorted).
- `election.ts:20` — `zeroShare()` literal `{R:0,…}` → build zeros from the scenario party list.
- `evaluate.ts:260-261` — efficiency_gap `voteTotals.R/.D` → the **two major parties** (the
  scenario's first two, or top-two by statewide vote). This is where GAME-112's two-party
  normalization plugs in; GAME-043 keeps it two-party (first two) to preserve behavior.
- `mapRenderer.ts:1376` — lean `partyShare.D − partyShare.R` → the two lean parties (parameterized).
- `panels.ts:28-31` — result card `.D/.R` labels + `voteTotals.D/.R` → loop the scenario parties
  (or top-two for the vote bar).
- `main.ts:247-248` — `PARTY_COLORS.D/.R` CSS props → per-party from the palette.
- `main.ts:716` — `partyIdToKey` (scenario id → R/D/L/G/I) is **deleted** — with PartyId-native
  types there's no key to map to; `evaluate.ts` criterion party lookups use the PartyId directly.

Mechanical key-swaps (bracket access already safe): `election.ts` iteration (`ALL_PARTIES` →
`scenario.parties`), `winnerOf` call sites, `seatsByParty`, `mapRenderer` `partyShare[topParty]`.

Stays static (party-agnostic): `DISTRICT_COLORS`, `MAX_DISTRICTS`, `districtColor()`, keyboard/
terrain/geometry, contiguity.

## How GAME-112 falls out

After 043, "third parties render" is nearly free: the builder already aggregates all parties and
the engine iterates the scenario's parties. GAME-112 then only needs (a) the **two-party
normalization** of efficiency_gap / mean-median (pick the two major parties), (b) party colors for
N>2 (palette already handles it), and (c) a >2-party scenario to exercise it. The multiparty demo
(`tutorial-005`, debug campaign) is 112's visible acceptance target.

## Risks & test strategy

- **Risk: subtle behavior drift** in the key-swap (e.g., tie-break order, margin runner-up). Mitigate
  by preserving the scenario-order tie-break and re-running the full suite — all 12 two-party
  scenarios must produce byte-identical results; the winnability e2e tests are the guard.
- **Risk: zundo/serialization** — `voteShare` as `Record<PartyId,number>` serializes fine (it's in
  `simulationResult`, which is partialized into undo history — GAME-106); confirm snapshots still work.
- **Risk: scope creep** — do NOT apply turnout/eligibility or change metrics' correctness here; that's
  112/113. 043 is a pure structural unification.
- **Test guard:** the existing unit + e2e suites (no behavior change) are the acceptance bar, per the
  ticket. Add no new behavior tests; add a party-agnostic fixture (a 3-party unit fixture) only if it
  helps lock the multiparty-capable shape — but its behavior is 112's.

## Decisions (resolved 2026-06-30)

1. **Party colors — (B) scenario-authored.** Add `Party.color?: string`, authored in all scenarios;
   palette-by-index remains the fallback for a party that omits it. Accepted cost: update the
   assembler + spec-types + all 12 scenario specs/JSONs to carry colors.
2. **Precinct id — keep numeric runtime `index`, carry string `scenarioId`** (low-risk; full string-id
   migration is out of scope).
3. **PartyShare shape — plain object `Record<PartyId, number>`** (serialization-friendly for zundo).
4. **File layout — new `model/runtime.ts` (types) + a builder** (rename `adapter.ts`→builder or keep
   the name with a comment).
5. **Sequencing — split.** Land 043 as a pure behavior-preserving unification (multiparty-*capable*,
   metrics still two-party); GAME-112 then flips the metric two-party-normalization and adds the
   3-party demo. Each with a clean regression bar.

## References

- Full consumer usage map: (in-session discovery, 2026-06-30) — every `.R`/`.D` site, `PartyShare`/
  `ALL_PARTIES`/`PARTY_COLORS` usage, and adapter field production, by file:line.
- Metrics audit: `thoughts/shared/research/2026-06-30-gerrymandering-metrics-audit.compressed.md`
- `game/web/src/model/{scenario.ts,types.ts,adapter.ts}`, `simulation/*`, `render/*`, `main.ts`
- Related tickets: GAME-112 (multiparty + two-party metrics), GAME-113 (framing copy), GAME-114
  (rename total_population), GAME-115 (debug campaign — to file), GAME-116 (generator N-party — to file)
