<!--COMPRESSED v1; source:2026-07-02-game-112-pr2-tutorial-005-demo.md-->
§META
date:2026-07-02 author:Claude+CJG ticket:GAME-112(PR2of2) status:approved-building-for-eyeball

§GOAL
Visible acceptance target for GAME-112: a scenario w/ a real third bloc exercising the multiparty engine (GAME-043 runtime + GAME-116 N-party generator + GAME-112-PR1 two-party metrics), proving multiparty end-to-end. Housed in debug campaign (GAME-115) → ships gated behind &debug, not discoverable by normal players.
REFRAME(user 2026-07-02): not generic "third party" but a locally-popular INDEPENDENT — same N-party stronghold mechanic, themed as a real local figure. Independent MAY win a seat if player concentrates her base (emergent from line-drawing, not hard-coded); "not enough to win" dropped.

§SCENARIO clone of tutorial-003 "Reading the Vote"
same map(radius-5 Hawthorn Bend, river, central city), same pedagogy family(Lean view+result panel; gates district_count+population_balance+contiguity; NO seat goal). New: East Hollow's champion = Independent "Ada Hollis"(gold #f0c040, palette slot 3).
zones(GAME-116 weight model — primary ken gets base+jitter, remainder split by weight):
  west(q_lte -1): Ken country {ken:0.60,ryu:0.35,hollis:0.05}
  east/Hollow(q_gte 2): Hollis stronghold {ken:0.25,ryu:0.25,hollis:0.50} → hollis≈0.50 wins those precincts
  center(default): Ken/Ryu tossup+light Hollis {ken:0.45,ryu:0.45,hollis:0.10}
PEDAGOGY: keep Hollow together→Hollis contends/wins that district; crack it→support dilutes. Packing/cracking applied to an independent — "lines decide" (T3's point + a third force). Win is emergent from the carve.

§VISIBILITY both card+map (the rendering work)
non-winning third bloc shows NOWHERE in today's 2-party UI (card=top-two only; Lean=party2−party1 PuOr gradient). Two changes:
1. result card(render/panels.ts): list EVERY scenario party's share (not just top-two), proportional multi-segment vote bar in each party's color. 2-party MUST look same as today(two segments, same order). Winner badge already uses winner's authored color(handles a Hollis win).
2. Lean map(render/mapRenderer.ts): PLURALITY-coloring rule for 3+ party scenarios — each precinct painted its plurality party's authored color(Hollis gold stronghold shows on map). 2-party scenarios keep existing PuOr gradient UNCHANGED (T1–T4 + 8 educational don't shift = regression guard). Rule keys off parties.length>2.

§WIREUP+METRICS
debug campaign(GAME-115) already points at tutorial-005; generating JSON makes it playable under &debug. Metrics correct already(GAME-112-PR1); scenario has no EG/mean-median goal anyway.

§STEPS
1. game/scenarios/tutorial-005.spec.yaml(clone)→generate tutorial-005.json via `bazel run //game/web/src/pipeline:generate_scenario -- <spec> <out>`
2. panels.ts all-party card + coverage(2-party card unchanged)
3. mapRenderer.ts plurality-coloring for 3+ parties(2-party gradient unchanged)
4. bazel test //game/... green; e2e as feasible(debug campaign→tutorial-005 loads/renders)
5. PUSH then serve-local EYEBALL by user BEFORE merge (visual PR — never auto-merge)

§RISKS
2-party render regression→card+lean MUST be byte-identical for 2-party; guard w/ existing e2e(T1–T4,educational)+explicit 2-party assertions. Independent-win edge→exercises third-party-win metric branch(GAME-112-PR1 flagged untested); this scenario is its coverage. Scope→demo+2 render changes only; no metric/turnout changes.

§REFS
game/scenarios/tutorial-003.spec.yaml(clone base), pipeline/generate-scenario.ts, render/panels.ts, render/mapRenderer.ts, model/campaigns.ts(debug→tutorial-005), GAME-116 demographics stage. Related GAME-112-PR1(#322)/116(#320)/115(#321)/043(#318,#319)
