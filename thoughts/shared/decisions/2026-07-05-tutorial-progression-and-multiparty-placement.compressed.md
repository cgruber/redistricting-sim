<!--COMPRESSED v1; source:2026-07-05-tutorial-progression-and-multiparty-placement.md-->
§META
date:2026-07-05 status:accepted
topic:tutorial progression + multi-party/independent placement — 6-rung public ladder, legality-only
impl:GAME-121(re-scoped, PR #331) reverses:GAME-121 seat-gate

§ABBREV
T=tutorial leg=legality-only(district_count+population_balance/contiguity)
coach=guided highlight script(DESIGN-012/GAME-076)

§STATUS
Accepted. REVERSES the tutorial-006 seat-gate decision from GAME-121(PR #331); re-scopes that PR.
One design fork(T004 capstone role) resolved by owner → Option A: single six-rung ladder.

§CONTEXT
Six tutorials exist, each .spec.yaml + generated .json + a $coach. Only four public:
- T001..004 = public "tutorial" campaign.
- T005(3-party race, GAME-120) + T006(home-base independent, GAME-121) = parked in debugOnly "debug" campaign, reachable only via ?campaign=debug&debug.
Two problems(owner asked "why 6, goals for each?"):
1. count accreted w/o progression design; 005/006 added per-ticket, parked in debug; vision doc still describes single tutorial → ladder reads incoherent.
2. T006 outlier on win condition. T001–005 gate $leg; electoral outcome EMERGENT(observed in live result panel, no winner required) — established pattern, consistent w/ criteria-only validity model("surface contingency of rules, not naturalize"). T006 alone shipped seat_count dhalsim>=1 objective = win/lose gate, only tutorial w/ mandated outcome.
Critically the coaches ALREADY teach the lessons via highlights:
- TUTORIAL_005 step2 rings Lean view + names 3 bases(Ken orange west, Ryu purple centre, Chun-Li teal east).
- TUTORIAL_006 step2 rings Lean + ⌂ home pin + states lean-vs-ballot rule("Lean map-wide; ballot home-only").
→ owner's ask("use guidance highlights to show how party leans work w/ multiple parties + independents") is already built. Work is mostly SUBTRACTION(remove goal+gating), not new authoring.

§DECISION
1. Principle — tutorials teach by guided demonstration, NOT outcome gates. Every tutorial gates $leg; outcome emergent(shown live, observed, never required); lesson carried by coach steps+copy. Already true of 001–005; 006 brought into line. (Outcome-shaped challenges live in the educational campaign scenario-002..009, not the tutorial arc.)
2. Remove T006 seat objective (reverses GAME-121). Drop seat_count dhalsim>=1; gate district_count+population_balance+contiguity like the rest. Lean-vs-ballot lesson survives as OBSERVATION: keep Hollow whole → eastern district holds Dhalsim home+base → on ballot AND wins(visible in panel); crack Hollow → wins nothing. Coach narrates, panel shows — no gate needed. (PR #331's "seat objective load-bearing" position was load-bearing only for a win/lose lesson; owner chose guided-observation, the more consistent pedagogy.)
3. Promote T005 + T006 into public progression. Move both out of debugOnly campaign into public tutorial arc. Multi-party races + independents are game MECHANICS(how map reads + election computes w/ >2 parties, + candidate whose lean≠ballot) → belong in teaching sequence, not dev sandbox.

§LADDER (public tutorial, six rungs)
| Rung | Scenario | New concept | Gate |
|---|---|---|---|
| 1 | T001 | Core loop: paint/undo/submit | district_count |
| 2 | T002 | Structural rules: balance+contiguity, Validity panel | +population_balance/contiguity |
| 3 | T003 | Electoral causality: Lean view + live result panel | $leg |
| 4 | T004 | Synthesis: every tool visible, no new mechanic | $leg |
| 5 | T005 | Multi-party leans: three parties; packing/cracking emerges | $leg |
| 6 | T006 | Independent: lean(map-wide) vs ballot(home-only) | $leg |

§FORK — RESOLVED: Option A (single six-rung ladder)
T004 authored as "capstone/bridge to real campaign"(closing beat "Then on to the real thing."). Placing 005/006 after breaks that framing. Owner chose Option A: one Tutorial campaign, six rungs. 004 no longer literal last rung; closing beat softens from "on to the real thing" → hand-off toward the two remaining situations; 006 becomes new bridge to campaign. Simplest model(one linear campaign), matches "I want them in the tutorial." 004's value(synthesising T1–T3) survives as internal milestone.
Rejected alt: two public campaigns "Basics"001–004 + "Advanced"005–006 — preserves 004 capstone but frames multi-party/independent as optional not core, + costs a second campaign.

§CONSEQUENCES — impl slice (re-scopes PR #331)
- game/scenarios/tutorial-006.spec.yaml: remove seat_count criterion; regenerate tutorial-006.json via pipeline.
- game/web/src/model/campaigns.ts: add T005,T006 to "tutorial" campaign; remove now-empty "debug" campaign (retain debugOnly field + visibleCampaigns filter for future).
- game/web/src/main.ts: KEEP T005/T006 in CAMPAIGN_ONLY_SCENARIOS (supplies card titles for campaign-only scenarios, as already for T001) + give public titles. They stay OUT of all-scenarios SCENARIO_MANIFEST → reachable only inside the tutorial campaign, in rung order.
- game/web/src/model/campaigns_test.ts: update/remove debug-campaign gating asserts(no campaign is debugOnly now); keep filter coverage via synthetic fixture, not retired "debug" campaign.
- game/web/src/tutorial/overlay.ts: reframe 006 closing from "Did you win Dhalsim his seat?" → observation; soften 005 "give each party a seat?"; Option A → soften 004 "on to the real thing." Highlight/teaching steps stay — they already do the job.
- game/web/e2e/tutorial-006-independent.spec.ts: no seat gate → BOTH maps pass("Map Passed!"). Winner-badge asserts stay + become load-bearing proof(Hollow whole → Dhalsim badge; cracked → no badge). Lose-foil verdict flips to pass, reframed: a legal map that still denies the Hollow its seat. Replace old ?campaign=debug&debug URLs here + tutorial-005-multiparty.spec.ts + home-independent.spec.ts w/ ?campaign=tutorial&s=…&debug: &campaign=tutorial puts scenario in activeList(not in SCENARIO_MANIFEST), &debug clears rung lock so a test can jump straight to a later rung.
- thoughts/shared/vision/game-vision.md(+.compressed.md): replace single-tutorial description w/ six-rung ladder + guided-teaching principle(both forms, same commit).
- sprint roadmap: note under S13 tutorial-walkthrough theme that arc is now six public rungs incl multi-party+independent.
- PR #331: retitle+rewrite body from "author tutorial-006 home-base independent" → "promote multi-party + independent as public no-goal tutorials"; re-scope GAME-121 resolution row in TICKETS.md(drop seat-objective/win-basin framing); amend squash commit msg. #331 NOT merged in seat-gate/debug-only form.

§EDUCATIONAL_UPSIDE
Tutorial arc now demonstrates full mechanical vocabulary — two-party, multi-party, independents — BEFORE the educational campaign asks the player to reason about gerrymandering techniques. Never tells the player which outcome is "correct": consistent w/ the thesis that district lines are choices whose consequences you learn to SEE, not win conditions handed down.

§REFS
criteria-only validity model: thoughts/shared/decisions/2026-05-18-criteria-only-validity-model.compressed.md
scenario data format ADR: thoughts/shared/decisions/2026-04-24-scenario-data-format.compressed.md
