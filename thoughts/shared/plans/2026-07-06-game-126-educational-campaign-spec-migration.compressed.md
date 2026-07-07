<!--COMPRESSED v1; source:2026-07-06-game-126-educational-campaign-spec-migration.md-->
§META
date:2026-07-06 author:Claude(Opus4.8) ticket:GAME-126 status:implemented(migration complete+green; PR held for owner eyeball)

§ABBREV
sc=scenario spec=.spec.yaml gen=gen-scenario-*.main.kts(legacy Kotlin generator)
ds=diagonal_strip rb=row_band pb=population_balance ss=safe_seats eg=efficiency_gap mm=mean_median cmpct=compactness
e2e=strategy-based winnability e2e cty=county_id

§GOAL
Migrate the six partisan educational $sc (003,004,006,007,008,009) from legacy $gen → the TS YAML pipeline ($spec → generate_scenario → .json), reproducing each $sc's pedagogical BONES (partisan geography, success criteria, winning strategy, narrative) as a reviewable/tweakable draft. Faithful re-authoring on the go-forward pipeline, NOT a redesign. Out of scope: 002(already migrated) + 005(VRA $sc, GAME-078/DESIGN-013 + Callais arc).

§CONTEXT
committed sc-00N.json = shipped source(globbed by BUILD, not build-generated); go-forward authoring = $spec(tutorials 001–006 + sc-002 already use it). $gen = drift-prone parallel path. Unifying on specs unblocks GAME-123(realism tuning on specs not Kotlin) + retires the parallel generators. Template: sc-002.spec.yaml.

§APPROACH
Bones→spec mapping(zone leans=Ken share unless noted; zones first-match-wins, order inner→outer):
| Sc  | Lesson/seed        | Zones(in order)                                           | Required                                                    | Optional        |
|-----|--------------------|----------------------------------------------------------|-------------------------------------------------------------|-----------------|
| 003 | Packing/43         | core lte2(.15)→suburb lte4(.42)→default(.65)              | district_count, $pb, seat_count ken gte4                     | $eg lte.15      |
| 004 | Cracking/44        | corridor r==0 {r_gte0,r_lte0}(.18)→default(.65)          | district_count, $pb, seat_count ken gte5                     | $mm ken lte.10  |
| 006 | Incumbency/66      | left q_lte0(.62)→default(.38)                            | district_count, $pb, $ss ken m.15 n3, $ss ryu m.15 n2        | $cmpct gte.35   |
| 007 | Neutral rules/77   | lte2(.25)→lte4(.45)→lte5(.55)→default(.67)               | district_count, $pb, $cmpct gte.50 [shipped tightened .40→.50]| $eg lte.15      |
| 008 | Geography/88       | lte2(.20)→lte4(.50)→default(.80)                         | district_count, $pb, $cmpct gte.40                           | $eg lte.10      |
| 009 | Cat/Dog reskin/99  | lte2(cat.82)→lte4(cat.72)→default(cat.42)                | district_count, $pb, $cmpct gte.40, $ss cat m.15 n3          | $ss dog m.15 n1 |
[007/008 shipped also tightened pop_tolerance .10→.05; spec reproduces SHIPPED not stale $gen]
Common frame: hex_axial hex_circle r6(127 precincts), 5 districts d1–d5, contiguity required, pop base 1500±150(uniform), one map-wide turnout, ken #c96d00 / ryu #7b35a8(009 cat/dog reuse palette). narrative+cosmetic counties+instigator_character+character_demographics transcribed from each JSON verbatim.
Two draft simplifications(PR-flagged): (1) initial "bad map" via $ds where no faithful rule exists; (2) uniform population + dropped per-zone turnout(bones=partisan-geography puzzles; turnout unused in sim).

§STEPS
1. Confirm regen invocation on 003; write compressed sibling; create GAME-126 + TICKETS row.
2. Exemplar 003: read JSON(narrative/criteria/counties/leans); author spec; regen; verify bones preserved + initial FAILS seat_count ken gte4 + packing ACHIEVABLE(feasibility witness) + 003 tests green.
3. Repeat 004/007/008/009/006.
4. Full bazel test //game/...; preview-verify a couple maps.
5. One draft PR(all six) held for owner serve-local eyeball.

§RISKS
regen drift breaks e2e(mitigated: strategy-based e2e robust; re-run+reconcile per sc; initial-FAILS+target-ACHIEVABLE verified each) | $ds initial trivially winnable(verify fails; adjust max_k) | criterion spec→shape for $ss/$mm/$eg(assembler handles all types used; majority_minority unused) | corridor reframe changes 004 look(→ resolved as-built: kept native r==0 corridor, no reframe).

§ASBUILT
Four material deviations(all in per-sc spec headers):
1. Pipeline WAS extended(plan's "no code changes" wrong for faithful 004/009). Added: r_lte/r_gte ZoneFilter predicates(spec-types.ts+demographics-stage.ts) → 004 corridor = true r==0 band; $rb InitialDistrictRule(assembler.ts) = max_r cascade reproducing $gen-004/-009 r-slab initialDistrict() EXACTLY. Both unit-tested(demographics-stage_test, assembler_test). Trade: 2 small tested general primitives > cosmetic reframe diverging from shipped.
2. Initial rule per-sc(refines simplification#1): 003/006/008=$ds(substitute for $gen angular wedges); 007=$ds native; 004/009=$rb(faithful to $gen r-band). Each initial only must FAIL objective(verified e2e).
3. 006 e2e rebalanced(structural, not seed-fished): shipped D5 col=28 hexes=+10.2% by count vs ideal 25.4 against ±10% tol; shipped Kotlin draw landed ~+8%(fragile, ~half fail on fresh seed). Migrated e2e moves 2 lower-q=3 hexes D5→D4(D4=27,D5=26; both stay Ryu-safe+contiguous) → balance robust(max +5.8% seed 66). Strategy unchanged(flanks separated, 3 Ken-safe+2 Ryu-safe).
4. 009 $cty split corrected lte4→lte3: audit across all six(probe shipped @- by ring/col/q vs each $gen countyId()) found ONE drift — 009 catville authored hex_dist_lte:4 but $gen+shipped split d<=3(d==4 ring=dogdale). Fixed+regen; corrected JSON matches shipped $cty precinct-for-precinct. 003/004/006/007/008 counties already exact.
Faithfulness bar(per sc): meta byte-compare via del(.precincts)(diffs limited to float-format 0.10 vs 0.1); party-share by ring/col vs $gen formula; $cty by position vs $gen+shipped; $pb headroom via jq; winnability via e2e. NOTE precinct pop/demographic VALUES differ from shipped(TS PRNG ≠ Kotlin PRNG) — expected; bones(shares/balance/winnability) preserved, not exact draws.
Generator retirement: 003/004/006/007/008/009 $gen deleted this PR(ref-checked clean — no BUILD/CI/.bzl/source refs). Kept gen-002(out of scope) + gen-005(VRA/arc).

§DONE
- Six specs authored; regenerated JSON reproduce bones(zones/criteria/winnability/narrative).
- Each sc: initial FAILS; intended technique ACHIEVES objective(feasibility witness per sc).
- bazel test //game/... → 47/47 green; no regressions.
- Plan + compressed sibling committed; GAME-126 resolved-moved in PR branch; draft PR held for owner eyeball.
- Legacy $gen for the six retired in this PR(ref-checked clean); gen-002 + gen-005 kept.
