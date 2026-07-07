# GAME-126: Educational Campaign Spec Migration (003, 004, 006, 007, 008, 009)

- date: 2026-07-06
- author: Claude (Opus 4.8)
- ticket: GAME-126
- status: implemented (migration complete + green; PR held for owner eyeball)

## Goal

Migrate the six partisan educational-campaign scenarios (003, 004, 006, 007, 008, 009)
from their legacy Kotlin `gen-scenario-*.main.kts` generators to the TS YAML pipeline
(`.spec.yaml` → `generate_scenario` → `.json`), reproducing each scenario's pedagogical
**bones** — partisan geography, success criteria, winning strategy, and narrative — in a
reviewable, tweakable draft. This is a faithful re-authoring on the go-forward pipeline,
not a redesign. (002 is already migrated; 005 is the VRA scenario, owned by
GAME-078 / DESIGN-013 and the Callais arc — out of scope here.)

## Context

- The committed `scenario-00N.json` files are the shipped source (globbed by BUILD, not
  build-generated). Today 003–009 are produced by legacy Kotlin scripts; the go-forward
  authoring path is `.spec.yaml` (tutorials 001–006 and scenario-002 already use it).
  Unifying on specs unblocks GAME-123 (educational-scenario realism tuning) to be done on
  specs rather than Kotlin, and retires a drift-prone parallel generator.
- Template: `scenario-002.spec.yaml` — the educational-scenario idiom (hex_axial hex_circle,
  ken/ryu with authored colors, ordered first-match zones, `diagonal_strip` initial,
  seat/balance/compactness criteria, full narrative, cosmetic counties).
- Capability check (`pipeline/spec-types.ts` + `demographics-stage.ts`, post GAME-116/119):
  the current pipeline expresses all six **without code changes**. See Approach.

## Approach

Pure content authoring — no pipeline / loader / assembler changes.

**Bones → spec mapping** (zone leans are the Ken share unless noted; zones are evaluated
first-match-wins, so order inner→outer):

| Sc  | Lesson / seed            | Zones (in order)                                                                 | Required criteria                                                                 | Optional                 |
|-----|--------------------------|----------------------------------------------------------------------------------|----------------------------------------------------------------------------------|--------------------------|
| 003 | Packing / 43             | core `hex_dist_lte 2` (.15) → suburb `hex_dist_lte 4` (.42) → `default` (.65)     | district_count, population_balance, seat_count ken gte 4                          | efficiency_gap lte .15   |
| 004 | Cracking / 44            | corridor `q_gte -1 & q_lte 1` (.18) → `default` (.65)  *(E–W→N–S reframe)*        | district_count, population_balance, seat_count ken gte 5                          | mean_median ken lte .10  |
| 006 | Incumbency / 66          | left `q_lte 0` (.62) → `default` (.38)                                            | district_count, population_balance, safe_seats ken m.15 n3, safe_seats ryu m.15 n2 | compactness gte .35     |
| 007 | Neutral rules / 77       | `lte 2` (.25) → `lte 4` (.45) → `lte 5` (.55) → `default` (.67)                   | district_count, population_balance, compactness gte .40  *(no seat gate)*         | efficiency_gap lte .15   |
| 008 | Geography / 88           | `lte 2` (.20) → `lte 4` (.50) → `default` (.80)                                   | district_count, population_balance, compactness gte .40                           | efficiency_gap lte .10   |
| 009 | Cat/Dog reskin / 99      | `lte 2` (cat .82) → `lte 4` (cat .72) → `default` (cat .42)                       | district_count, population_balance, compactness gte .40, safe_seats cat m.15 n3   | safe_seats dog m.15 n1   |

**Common frame:** hex_axial hex_circle radius 6 (127 precincts), 5 districts d1–d5,
`population_tolerance 0.10`, `contiguity: required`, population base 1500 ± 150 (uniform),
one map-wide `turnout` range, ken `#c96d00` / ryu `#7b35a8` (009 cat/dog reuse the same
palette). Narrative (character / intro_slides / objective / epilogue), cosmetic counties
(model + id_prefix), `instigator_character`, and `character_demographics` are transcribed
from each scenario's current JSON so the shipped copy is preserved verbatim.

**Two deliberate draft simplifications** (flag in the PR for owner tweak):
1. Initial layouts use `diagonal_strip` (the only spec-supported initial rule) as a generic
   FAILING starting map, replacing the gen scripts' angular-wedge (003/006/008) and r-band
   (004/009) starts. 007 already used diagonal strips — direct. The initial only needs to
   fail the objective, not carry narrative meaning.
2. Uniform population + dropped per-zone turnout. The bones are partisan-geography puzzles;
   density is not load-bearing, and turnout is unused in the current simulation.

## Steps

1. Confirm the regen invocation (BUILD target / runner) on 003; write this plan's compressed
   sibling; create GAME-126 + TICKETS.md row.
2. **Exemplar — 003:** read `scenario-003.json` (narrative, criteria, counties, exact leans);
   author `scenario-003.spec.yaml`; regenerate; verify (a) bones preserved, (b) the
   `diagonal_strip` initial FAILS `seat_count ken gte 4`, (c) the packing target is
   ACHIEVABLE (record a feasibility witness — a concrete winning partition), (d) existing 003
   tests still green.
3. Repeat for 004 (corridor reframe; crack-to-5 achievable), 007 (direct diagonal_strip; no
   seat gate; ~2 Ken / 1 swing / 2 Ryu emerges), 008, 009 (cat/dog + safe_seats), 006
   (flanks + dual safe_seats).
4. Full `bazel test //game/...`; preview-verify a couple of regenerated maps.
5. One draft PR (all six) held for owner serve-local eyeball.

## Risks

- **Regen drift breaks existing e2e / winnability.** Educational e2e are strategy-based
  (game actions with comments, not precomputed index arrays) so relatively robust; still
  re-run per scenario and reconcile (tune the spec or update the test). Each scenario's
  initial-FAILS + target-ACHIEVABLE is verified explicitly (the same discipline the VRA arc
  will need).
- **Diagonal-strip initial might accidentally pass / be trivially winnable.** Verify it
  fails; adjust strip cut points (`max_k`) if needed.
- **Criterion spec→shape for safe_seats / mean_median / efficiency_gap.** Confirm
  `CriterionSpec` fields (margin / min_count / threshold / operator) thread through the
  assembler for 003/004/006/009; the assembler already handles all criterion types used here
  (majority_minority is the only unsupported one, and none of the six use it).
- **Corridor reframe changes 004's look** (N–S instead of E–W). Cosmetic; note in the PR.

## Done

- Six `.spec.yaml` authored; regenerated `.json` reproduce the bones (zones, criteria,
  winnability, narrative).
- Each scenario: initial map fails; the intended technique achieves the objective
  (feasibility witness recorded per scenario).
- `bazel test //game/...` green; no regressions.
- Plan + compressed sibling committed; GAME-126 resolved-moved in the PR branch; draft PR
  held for owner eyeball.
- Legacy `gen-scenario-00N.main.kts` for the migrated six: retired in this PR (superseded;
  ref-checked clean — no BUILD/CI/`.bzl`/source references). Kept `gen-scenario-002`
  (out of scope) and `gen-scenario-005` (VRA scenario / Callais arc).

## Implementation notes (as-built)

The migration deviated from this plan in four material ways; all are documented in the
per-scenario `.spec.yaml` headers and reproduced here for the decision record.

1. **Pipeline WAS extended (the plan's "no code changes" was wrong for a *faithful* 004/009).**
   Rather than reframe 004's E–W corridor to a N–S `q`-band (plan Approach), I added two
   spec primitives so 004 and 009 keep their native geometry verbatim:
   - `r_lte` / `r_gte` `ZoneFilter` predicates (`spec-types.ts`, `demographics-stage.ts`) —
     004's corridor is the true `r == 0` band (`{ r_gte: 0, r_lte: 0 }`), not a reframe.
   - `row_band` `InitialDistrictRule` (`assembler.ts`) — a `max_r` cascade that reproduces
     gen-scenario-004's and -009's r-slab `initialDistrict()` **exactly**.
   Both are unit-tested (`demographics-stage_test.ts`, `assembler_test.ts`). Net: faithful
   004/009 geography + initial maps at the cost of two small, tested, general primitives —
   a better trade than a cosmetic reframe that would have diverged from the shipped map.

2. **Initial-rule choice is per-scenario, not uniform `diagonal_strip` (refines simplification #1).**
   003/006/008 use `diagonal_strip` (a faithful *substitute* for the gen scripts' angular
   wedges — no angular-wedge rule exists); 007 used `diagonal_strip` natively; 004/009 use
   `row_band` (faithful to their gen r-band initials). Every initial still only has to FAIL
   the objective, which each does (verified by e2e).

3. **006 winnability e2e rebalanced (structural, not seed-fished).** The shipped e2e's
   far-right column D5 held 28 hexes = +10.2% by count vs the ideal 25.4, against a ±10%
   `population_tolerance`; the shipped Kotlin draw happened to land D5 at ~+8%, so a faithful
   regen fails ~half the time on a fresh seed regardless of value. The migrated e2e moves 2
   lower-`q=3` hexes from D5 to the adjacent D4 (D4=27, D5=26) — both stay Ryu-safe and
   contiguous — so balance is robust under regeneration (max district +5.8% at seed 66). The
   strategy (flanks separated, 3 Ken-safe + 2 Ryu-safe) is unchanged.

4. **009 county split corrected (`d <= 4` → `d <= 3`).** A `county_id` audit across all six
   (probing shipped `@-` by ring/column/`q` vs each gen `countyId()`) found one drift: 009's
   `catville` was authored at `hex_dist_lte: 4` but gen + shipped split at `d <= 3` (the
   `d == 4` ring is `dogdale`). Fixed and regenerated; the corrected JSON matches shipped
   `county_id` precinct-for-precinct. 003/004/006/007/008 counties were already exact.

**Faithfulness bar (what "reproduces the bones" means here).** Verified per scenario:
meta byte-compare via `del(.precincts)` (differences limited to semantically-identical float
formatting, e.g. `0.10` vs `0.1`); party-share by geography (ring/column) vs each gen formula;
`county_id` by position vs gen + shipped; population-balance headroom via `jq`; winnability via
the strategy-based e2e (`bazel test //game/web:e2e_test`). Note precinct-level population and
demographic *values* differ from the shipped JSON — the TS pipeline PRNG is not the Kotlin gen
PRNG — which is expected: the pedagogical bones (geography shares, balance, winnability) are
preserved, not the exact random draws.

`bazel test //game/...` → 47/47 green.
