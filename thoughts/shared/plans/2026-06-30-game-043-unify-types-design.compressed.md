<!--COMPRESSED v1; source:2026-06-30-game-043-unify-types-design.md-->
§META
date:2026-06-30 author:Claude(Opus4.8)+cgruber ticket:GAME-043 status:approved 2026-06-30 — ready to implement

§GOAL
Retire the two parallel type systems (model/scenario.ts canonical party-agnostic vs model/types.ts spike fixed-key R/D/L/G/I) into ONE unified party-agnostic runtime model, so multiparty (GAME-112) falls out. Behavior-preserving (all 12 shipped scenarios are 2-party; existing 47 tests = regression guard).

§CONTEXT
adapter.ts translates scenario→spike at load, positionally maps parties[0]→R parties[1]→D, DROPS parties past 2. sim+render (election/validity/evaluate/mapRenderer/panels/gameStore) run on spike types. This split was a Sprint-1 shortcut never cleaned.

§APPROACH
CRUX = party representation: retire PartyKey/PartyShare{R,D,L,G,I} → shares keyed by scenario PartyId (canonical model already uses Record<PartyId,number>).
- PartyShare → Record<PartyId,number> (plain object, serialization-friendly for zundo). winnerOf(share, parties[]) takes scenario party order; tie-break=first-in-scenario-order (preserves determinism). DistrictResult.winner:PartyId, voteTotals:Record<PartyId,number>, seatsByParty:Record<PartyId,number>, PreviousResult.winner:PartyId.
UNIFIED Precinct: one RuntimePrecinct built once at load (new model/runtime.ts). KEEP numeric runtime `index` (load-bearing: AssignmentMap<number>, BFS, keyboard-nav, WIP) + carry string scenarioId. DROP dummy demographics{male,female,nonbinary}. Fields: index, scenarioId, name?, county_id?, county_name?, coord, center, neighbors(numeric), passableNeighbors?, terrainAnnotation?, population, voteShare:Record<PartyId,number>, previousResult, groupShares?.
adapter.ts → a BUILDER (not translator): derives geometry/neighbors/terrain/previousResult + aggregates ALL parties (voteShare[p.id]=Σ group.pop_share×group.vote_shares[p.id]). behavior-preserving today (2-party); enables 112. Keeps current pop-weighted aggregation — turnout/eligibility stay UNUSED (112/113).

§DECISIONS (resolved 2026-06-30)
1 party colors = (B) scenario-authored: add Party.color?:string authored in all scenarios; PARTY_PALETTE(current 5 hexes, by party order) = fallback. cost accepted: update assembler+spec-types+all 12 scenario specs/JSONs to carry colors; loader validates color as string when present. ken/parties[0]=orange ryu/parties[1]=purple (preserve look). --party-d/-r CSS props → per-party resolved color.
2 precinct id = keep numeric index + carry string scenarioId (full string-id migration out of scope).
3 PartyShare = plain object Record<PartyId,number>.
4 layout = new model/runtime.ts + a builder.
5 sequencing = SPLIT: 043 pure behavior-preserving unification (multiparty-capable, metrics still 2-party) → GAME-112 flips metric 2-party-normalization + adds 3-party demo.

§STEPS (consumer migration — from full usage map)
hardcoded .R/.D sites that MUST change:
- adapter.ts:140 margin partyShare.D−partyShare.R → margin vs actual runner-up (sorted)
- election.ts:20 zeroShare() {R:0,…} → build zeros from scenario party list
- evaluate.ts:260-261 efficiency_gap voteTotals.R/.D → the two major parties (first two; 112 does the proper 2-party-normalization)
- mapRenderer.ts:1376 lean partyShare.D−partyShare.R → the two lean parties (parameterized)
- panels.ts:28-31 result card .D/.R labels+voteTotals → loop scenario parties (top-two for vote bar)
- main.ts:247-248 PARTY_COLORS.D/.R CSS props → per-party from resolved color
- main.ts:716 partyIdToKey DELETED (PartyId-native; evaluate criterion party lookups use PartyId directly)
mechanical key-swaps (bracket access already safe): election iteration ALL_PARTIES→scenario.parties; winnerOf call sites; seatsByParty; mapRenderer partyShare[topParty].
STAYS static (party-agnostic): DISTRICT_COLORS, MAX_DISTRICTS, districtColor(), keyboard/terrain/geometry/contiguity.

§RISKS
- behavior drift in key-swap (tie-break order, margin runner-up) → preserve scenario-order tie-break; all 12 2-party scenarios byte-identical; winnability e2e = guard.
- zundo/serialization: voteShare Record serializes fine (in simulationResult, partialized GAME-106); confirm snapshots.
- scope creep: do NOT apply turnout/eligibility or change metric correctness — that's 112/113.

§DONE (AC per ticket)
single unified runtime model; election/validity/evaluate/mapRenderer/gameStore on it; adapter eliminated-or-trivial; types.ts eliminated-or-shared-utils-only; partyIdToKey/SPIKE_PARTY_KEYS/dummy-demographics removed; all unit+e2e pass with NO behavior change (the acceptance bar).
