<!--COMPRESSED v1; source:2026-07-02-district-candidates-and-independents.md-->
§META
date:2026-07-02 author:Claude+CJG ticket:GAME-117,GAME-118 status:approved-design-of-record

§IDEA
A district is won by a NAMED CANDIDATE, not an abstract party. Both "outcomes read as people" + the independent mechanic fall out of one idea:
- PARTY = fields a candidate in EVERY district → per-district share converts to a seat anywhere, can win many.
- INDEPENDENT = single person on the ballot in ONE district (home) → wins ≤1 seat, only there.
Scenarios w/o independent = today's behavior (parties only). Candidate names OPTIONAL (absent→fall back to party name) → existing scenarios unaffected.

§LEAN_VS_BALLOT (drives this)
LEAN=voter preference (who a precinct favors); stays map-wide for everyone incl. independent (regional popularity real); UNCHANGED. BALLOT=who's actually running in a district: party runs everywhere, independent runs only at home. That's the layer that changes. Independent's lean high across region while ballot presence (+ability to win) exists in exactly one district.

§GAME-117 named per-district candidates
model: each (district,party) has a candidate name; winner displays "Candidate (Party) +margin". No candidate authored→fall back to party name (today) → 2-party + all existing scenarios unchanged.
schema: additive OPTIONAL candidate authoring (candidates map district→party→name, OR per-party candidates:{<districtId>:<name>}); loader validates strings; decide exact shape in ticket.
render: panels.ts result card + mapRenderer.ts info/result show winning candidate name+party (color/badge unchanged). One person can't hold 2 seats → per-district names make multi-seat party wins read right.
OUT OF SCOPE: independent restriction (=118); names only.

§GAME-118 home-base independent (opt-in)
model: independent candidate w/ independent:true + HOME (precinct id / coord→precinct). Election:
  home district → independent ON ballot; winner=plurality over parties + independent.
  other districts → independent EXCLUDED from seat; winner=plurality over PARTIES only (his supporters fall back to a party for the seat; lean latent, shown not on ballot).
  ⇒ independent wins ≤1 seat, only home.
UX: home pin on map (⌂ <name>); non-home result/info note party-only race; home district shows independent contender; lean map unchanged (independent map-wide).
lesson(richer than party): elect→draw district around home+base; defeat→crack base or draw home into opp-dominated district. Party spreads risk across seats; independent lives/dies by one line.
metrics: two-party normalization(GAME-112) already restricts EG/mean-median to 2 majors→independent doesn't corrupt. Confirm home-district independent-WIN branch covered (GAME-112-PR1 flagged untested).
builds on 117 (independent = candidate existing in one district).
CLARIFICATIONS(#324 review): (a) votes OUTSIDE home = DISREGARDED for the seat (non-home winner=plurality among PARTIES as-is; NO redistribution — 2nd prefs not modeled; his support unrepresented on that ballot; consistent w/ two-party metric excl. non-majors; precinct shares unchanged, only seat contest excludes him). (b) MULTIPLICITY: ≥0 independents, each w/ own home, on ballot only in home district (no global "the independent"). (c) UNASSIGNED home mid-draw: home unassigned→independent on NO ballot (like an unassigned precinct contributes to no seat)→becomes contender once home placed; falls out of "on ballot in district containing home", no special-case.

§GAME-119 feature-anchored zone filters
zone filters today = q_lte/q_gte/hex_dist_lte-from-ORIGIN only → artificial q-bands. Add PROXIMITY filters: near:{q,r} within:N (dist to arbitrary point — settlements at known anchors) and/or near_river/near_feature. Deterministic, behavior-preserving (new optional keys). Also carry T4 terrain into tutorial-005 for progression.

§GAME-120 rebuild tutorial-005 = multi-party tutorial
clean 3rd/4th-PARTY tutorial (parties contest everywhere), leans on features(119), outcomes as named candidates(117). Retire artificial 3-band draft. Debug-gated until tutorial set ready to promote.

§GAME-121 independent tutorial
new scenario on home-base independent(118)+candidates(117) — Dhalsim done right: one home district, base to pack/crack, home pin. Teaches independent mechanic, distinct from multi-party tutorial.

§SEQUENCE
117→118→119 (features) then 120,121 (tutorials). 117=keystone (outcomes as people; 118 extends it). Tutorials teach MECHANICS; political-effect scenarios (rules choking a 3rd party) = later real content, not these.

§REFS
scenario.ts(Party,schema), loader.ts, simulation/election.ts(winner), render/panels.ts+mapRenderer.ts(result/info), pipeline/spec-types.ts+demographics-stage.ts(zone filters). Prior GAME-112/116/115/043.
