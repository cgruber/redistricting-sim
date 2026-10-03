<!--COMPRESSED v1; source:2026-10-02-educational-campaign-coherence-review.md-->
§META
date:2026-10-02 researcher:agent(owner-requested pre-playtest review) commit:d50cdbd8(main+PR #343 head) branch:edu-campaign-review repo:cgruber/redistricting-sim
topic:holistic coherence+quality review of Educational Campaign(pre-playtest)
tags:educational-campaign,content,narrative,neutrality,ux,playtest status:complete

§ABBREV
sc=game/scenarios/scenario- d14=DESIGN-014 ver=verified(reproduced|read directly) jdg=judgment(editorial call; yardstick stated) EG=efficiency-gap

§SUMMARY
owner brief: catch what would slip into playtest; don't invent problems.
method: read all player-facing text(9 scenarios: motivation,slides,objective,criteria)+wrap-up+About; clicked every intro at 1280×720+375×812 on serve-local; ran e2e compact assignment for 007+008; reproduced tutorial end-of-campaign flow; checked GAME-078/113/123+$d14 to avoid re-reporting.
order(campaigns.ts): 002→003→004→005(Valle Verde)→010(Vera County)→006→007→008→009

§TIER1_FIXED(PR #343)
1 intro controls unreachable when card>viewport [$ver,fixed,regression-tested]: #intro-screen align-items:center + body overflow:hidden → tall card overflows both edges, Next/Start offscreen, unscrollable
  nav overflow: 1280×720→010 s3 36px | 375×812→005 s3 69px; 008 6–7px; 010 all slides 49/29/240/14px
  fix: card margin:auto + screen overflow-y:auto(styles.css #intro-screen/#intro-card/#btn-intro-skip); Skip position:fixed + opaque backing(screen color) → phone text scrolls beneath, not through label(checked 375×812 010 s3 top+mid-scroll; desktop unchanged); e2e 375×812 clicks through all 010 slides(scenarios.spec.ts "intro briefing: on a phone-sized viewport…"); red w/o fix, green with
2 stale test names/comments [$ver,fixed]: 005 smoke named "VRA character"; 007 winnability comment wrong tolerance+threshold
3 Valle Verde/Vera County narrative pass(owner-directed): 005 no longer names VRA; 010 callback + "as if fight already won" caveat

§TIER2_BUG(GAME-131)
tutorial completion shows educational wrap-up [$ver serve-local]: ?s=tutorial-006&campaign=tutorial&debug → force-win → Continue → Next Scenario → wrap-up: "You've completed every scenario. You've drawn maps that packed voters, cracked communities, protected incumbents, satisfied reformers, and proven that no set of rules can make redistricting apolitical."
cause: goToNextScenario()(main.ts:1880) shows single static #wrap-up-screen(index.html:140) when active list exhausted; copy written for educational arc. beta affected PER DEPLOYED BUILD(not clicked through on beta): beta=v0.0.17(web_deploy beta/deployment-metadata.json); its campaigns.ts tutorial ungated w/ tutorial-006 last; deployed index.html same wrap-up text; main.ts differs from main by 1 unrelated line. "every scenario" false while educational=coming soon
also, even for educational: predates VRA arc(005/010), not mentioned | [$jdg] "proven that no set of rules can make redistricting apolitical"=contested conclusion; yardsticks: About "better questions, not predetermined answers" + $d14 "Some argue X; others argue Y"
needs owner copy decision(per-campaign wrap-up; what educational concludes)→ticketed not fixed

§TIER3_OWNER_CALL(not bugs; likely playtester-noticed)
3.1 debrief on only 1/9 educational(002); all 6 tutorials have one(GAME-094) → 8 end on pass/fail, no reflection. GAME-078 plan(plans/2026-07-09-game-078-vra-arc.md:172) makes debrief where value-debate handed to player for VRA scenarios; same logic arguably for any contested ending(006,007/008). 010 epilogue already=GAME-078 Increment 2. [$ver: counted in JSONs]
3.2 007+008 same lesson back-to-back [$ver text]: both independent commission,"No partisan data allowed",compact+equal-pop+contiguous,court order. 007 s3 "Neutral rules don't produce neutral outcomes. They produce different outcomes."/"not a bug in your map — it's a feature of where people live." 008 s2 "neutral rules don't produce neutral outcomes. They produce outcomes driven by geography."/s3 "This is not a bug in your map. It's a feature of representative democracy that no one has solved."
  maps differ: Ken vote 007 50.4% | 008 60.9%. e2e compact assignment: 007 pass EG 9.1% ryu-disadvantaged(inside optional ≤15%); 008 pass EG 28.3% ryu-disadvantaged(fails optional ≤10%). EG-only→008 shows geography effect strongly, 007 weakly; seats NOT read; 1 assignment/map≠distribution
  options: merge | differentiate(007=control "neutral looks fine here", 008=lopsided-geography contrast; numbers roughly support, text doesn't say)
3.3 008 Ken complains despite ~61% [$ver text] s3: "Ryu will say the compact map packed their voters unfairly. Ken will say their geographic spread deserves more representation. Both arguments will have merit." measured compact map: Ken=EG-advantaged → complaint may not match result
3.4 "No partisan data allowed" unenforced in 007/008(007 objective "No partisan data required — or allowed."); lean view+election results available. flags exist(hide_view_toolbar,hide_election_results; tutorial-001 uses) unset for 007/008 [$ver]. enforcing=gameplay change→owner
3.5 002+003 both teach packing back-to-back; 003 adds EG. weaker than 3.2 [$jdg]
3.6 player always gerrymanders for Ken(rural/suburban) vs Ryu(urban) in 002/003/004; only 009(Cats, comic) puts player on urban-majority side [$jdg] → may read as one side always the gerrymanderer; yardstick $d14 content must not "appear to take sides". cheapest: swap instigator in one of 002–004. GAME-123 adjacent, doesn't cover
3.7 loaded wording [$jdg vs $d14 "Scenario narrative language"]: 008 objective "Watch both sides declare the process rigged."($d14 names "rigging" as loaded; parties' voice but in objective line) | 006 motivation "The voters don't need to know the details."(editorializes deal as deceptive) | 006 s3 "What the Voters Lose" only case against safe seats; $d14 "Some argue X; others argue Y"; missing counters(stability,seniority,constituent service,fewer wasted votes/district)

§TIER4_MINOR(record only)
010 s3 long on phone(~1.7 screens 375×812); scrollable now; trim candidate
unlock order relocks 006: unlock=prev completed(main.ts:294,:550); 010 inserted 005↔006 → prior-progress players find 006 locked behind 010; dev/local only(educational coming soon on beta)
optional-bonus attainability untested except 002 verdict stars; unattainable bonus only shows in playtest; low priority

§CLEAN
same overlay class @375×812: result screen(007, 5 criteria) buttons on-screen, criteria list scrolls in card(GAME-094); 002 debrief buttons on-screen; wrap-up(4-line card) not measured at phone
"nine scenarios" matches list; balance descriptions match population_tolerance; all 9 have winnability e2e; 009 "about 60%" Cat=58.1%; 010 "Latino voters" consistent w/ GAME-113 owner model(population=turned-out voters); compactness/EG threshold labeling=GAME-113; partisan realism=GAME-123

§OWNER_DECISIONS
| # | Item | Decision |
|---|---|---|
| 2 | wrap-up text(GAME-131) | per-campaign copy; educational conclusion |
| 3.1 | debriefs 8/9 | write for v1.0 or accept pass/fail endings |
| 3.2/3.3 | 007 vs 008; Ken complaint | merge/differentiate/keep |
| 3.4 | enforce no-partisan-data 007/008 | gameplay change or not |
| 3.6 | always Ken in 002–004 | swap one or accept |
| 3.7 | "rigged"; 006 one-sided slide | reword or keep |
