<!--COMPRESSED v1; source:2026-07-05-game-121-tutorial-006-independent.md-->
§META
date:2026-07-05 ticket:GAME-121 status:partially-superseded
design-of-record:$ts/plans/2026-07-02-district-candidates-and-independents.compressed.md(§GAME-121 "Dhalsim done right")

§ABBREV
ts=thoughts/shared T=tutorial ind=independent
leg=legality-only(district_count+population_balance+contiguity)

§STATUS — PARTIALLY SUPERSEDED (2026-07-05)
seat-gate objective(§APPROACH.2) + debug-campaign housing(§STEPS Registration/Merge-gate) REVERSED before merge by tutorial-progression ADR($ts/decisions/2026-07-05-tutorial-progression-and-multiparty-placement.compressed.md).
Final: T006 ships $leg (no seat_count) as RUNG 6 of the PUBLIC tutorial ladder, not a seat-gated demo in the debug campaign. WIN/LOSE maps now read as OBSERVED outcomes, not pass/fail.
Still HOLDS(implemented): Option-A pipeline extension(§APPROACH.1), map geometry/zones(§APPROACH.3), feasibility proof(§FEASIBILITY). See ADR for decision + six-rung ladder.

§GOAL
New T006 teaches GAME-118 home-base $ind: map-wide LEAN but BALLOT only in district holding home precinct. Dhalsim(eastern Hollow yogi) done right(GAME-112 draft→T005 faked $ind as full party; genuine mechanic first authored here).
Lesson: keep Hollow whole around home→on ballot AND has votes→wins seat; crack base(or draw home into party stronghold)→on ballot at home but diluted below plurality, support elsewhere off-ballot→wins nothing. Lines alone decide.

§CONTEXT
Follows GAME-118(home-base mechanic), GAME-120(three-party T005). Pipeline couldn't author an $ind: spec-types PartySpec lacks independent/home; assembler.ts:84-89 field-picks(no spread)→those keys dropped.

§APPROACH
1. Extend pipeline(Option A, this PR): PartySpec+=independent?/home?; assembler pass-through; round-trip test. Spec fully generates JSON, no drift. [rejected B=hand-add to JSON→permanent regen drift(project_scenario_generation_reality)]. Comingled w/ sole consumer(this tutorial)→focused-PR exception carves it out; completes GAME-118 authoring story.
2. [SUPERSEDED→$leg] Seat gate seat_count dhalsim>=1(not T5-style $leg): required electing Dhalsim to force mechanic exercise; losing(cracked) map stays legal+reachable. Flagged for owner eyeball-veto → owner chose $leg; reversed per ADR.
   Gate soundness verified end-to-end(still true, now for the OBSERVED win): election.ts:107-111 counts $ind winner into seatsByParty(election_test.ts:358 "I holds exactly one seat"); evaluate.ts:234 reads seatsByParty[c.party]??0(robust to non-major); panels.ts:88 full winner badge, breakdown ⌂ Dhalsim in-home/(not on ballot) elsewhere(80-82)+footnote(115-118); main.ts:761-763 enforceBalance from population_balance presence only(seat_count would not disturb submit gate); two-party metrics survive $ind win(evaluate.ts:287-292 EG else-branch=both majors' 2-party votes wasted; mean-median share-based+2-party-normalized).
3. Map: hex_axial hex_circle r5(91 precincts), 3 districts, NO terrain(uniform pop so balance never FORCES a shape; riverside 1.3x would bias a column heavy). Base=eastern q-STRIP(q_gte 2) NOT near/within disk(disk cracked by bands can stay home-majority; strip cracked by bands dilutes cleanly: thin eastern sliver vs long western body). q_gte/q_lte supported(demographics-stage.ts:13-14).
   Parties(declaration order fixes majors@slots0/1): slot0 Ken(major,#2166ac,GAME-116 primary carries jitter,leads WEST) slot1 Ryu(major,#7b35a8,leads CENTER) slot2 Dhalsim($ind,#2a9d8f,home{q:3,r:-1},leads EAST). All cool hues→stay distinct through lean contested-paling(warm orange/gold collapse fixed in GAME-120).
   Zones(first-match; GAME-116 weights sum1.0 w/ primary→realized literally): west q_lte-2 {ken.52 ryu.38 dh.10}→Ken; east q_gte2 {ken.30 ryu.22 dh.48}→Dhalsim; center default {ken.30 ryu.50 dh.20}→Ryu.
   Candidates(GAME-117): majors field 3 each(flavour); Dhalsim same person every district slot([Dhalsim,Dhalsim,Dhalsim])→badge always "Dhalsim" regardless of home district number.

§FEASIBILITY — PROVEN vs generated JSON (GAME-120 rigor)
Faithful re-impl of election.ts(weighted shares + $ind home-eligibility) + BFS contiguity over real axial-hex adjacency, on actual jittered tutorial-006.json(91 precincts, seed21). All green:
- WIN=q-column thirds(q≤−2|−1..1|q≥2)→30/31/30(dev−0.7/+1.7/−1.0%),each contiguous. West→Ken+14.8%, Centre→Ryu+20.1%, East→Dhalsim+18.0%(home inside,on ballot,share0.480). → balance PASS, contiguity PASS, dhalsim seats=1.
- LOSE=r-band thirds(r≤−2|−1..1|r≥2)→30/31/30(dev−0.8/+1.9/−1.1%),each contiguous. Home mid-band→Ken+2.6%, Dhalsim0.261(third,~12pt back), off-ballot in other bands. → balance PASS, contiguity PASS, dhalsim seats=0. Legal map that still denies the Hollow its seat(now the OBSERVED silenced-community foil; was the seat_count-fail AC-#5 foil).
- Win-basin WIDE(not knife-edge): Dhalsim carries eastern home district {q≥T} across T=3(0.481)→2(0.480,balanced third)→1(0.411,75%east)→0(0.366,59%east). Needs only ~>54% of district from east zone to out-plurality Ryu; balanced eastern third=100% east-zone→any reasonable eastern district a guided player draws wins. No fallback to $leg needed(now moot: $leg is the gate).
Contiguity also enforced LIVE by engine submit gate in winnability e2e(illegal map blocks Submit+fails test)→proven twice.

§STEPS
- Registration [SUPERSEDED debug→public]: campaigns.ts "tutorial" campaign lists 001–006(was: debug campaign scenarioIds+=T006); main.ts CAMPAIGN_ONLY_SCENARIOS+=T006 w/ public card title(kept OUT of all-scenarios SCENARIO_MANIFEST→reachable only inside campaign); overlay.ts TUTORIAL_006 coach(orient→Lean: east base+⌂ pin→lean-vs-ballot beat: paint Hollow together→Done)+SCRIPTS registry(guided:true honesty); game/scenarios/BUILD.bazel globs *.json(no edit for new JSON).
- Tests: e2e/tutorial-006-independent.spec.ts smoke(loads via campaign, ⌂ pin+lean render, no console errors); winnability whole-Hollow(paint WIN q-columns by legible coord rule→submit→Dhalsim holds home seat+criteria pass; [SUPERSEDED: was seat_count pass]→now three named winner badges incl Dhalsim→"Map Passed!"); cracked-Hollow foil(r-band map→Dhalsim 0 seats; [SUPERSEDED: was seat_count FAIL]→now STILL "Map Passed!", silenced-community foil made executable); assembler round-trip($ind/home spec→JSON carries both). bazel test //game/web/... green before push.

§DONE
Pipeline authors $ind from spec(no JSON hand-patch/drift); T006 legality-only public RUNG 6; WIN+LOSE maps both legal+reachable, outcome OBSERVED live(not gated); coach teaches lean-vs-ballot via highlights; six-rung campaign-select order+0/6 progress; assembler passthrough+absence units; bazel 46/46. [SUPERSEDED merge-gate: was seat-gate-deviation eyeball veto ask]→held for owner serve-local eyeball(feedback_eyeball_in_dev).

§OUT_OF_SCOPE
terrain/visual texture(eyeball-time refinement, balance-re-checked); broader author-$ind N>1(one home-base $ind is the ticket).
