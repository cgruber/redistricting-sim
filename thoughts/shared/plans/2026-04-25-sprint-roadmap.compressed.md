<!--COMPRESSED v1; source:2026-04-25-sprint-roadmap.md-->
§META
date:2026-04-25 last_updated:2026-04-26 status:active type:sprint-roadmap
LIVING DOC — update at sprint start (fill tickets) + after demo (outcomes, re-evaluate next)

§ABBREV
sp=sprint S1=Sprint1 … S7=Sprint7
pc=precinct dist=district ET=election-type
v1=version 1

§CADENCE
checkpoint-based NOT time-boxed; $sp done when demo target met
current $sp: tickets planned in detail before work; future $sps: sketched until prior $sp closes

§V1_GOAL
playable browser game; 8-12 scenarios; gerrymandering mechanics
single-player desktop-first fictional-regions FPTP-only local-storage no-user-accounts
see game-vision.compressed.md for full scope

§SPRINT_OVERVIEW
| $sp | goal | demo | status |
|-----|------|------|--------|
| S1 | load+display real scenario | tutorial JSON→hex map; player paints $dists; Playwright harness live | complete — 2026-04-25 |
| S2 | edit map + live feedback | live pop-balance, contiguity, $pc tooltip | complete — 2026-04-25 |
| S3 | test the map | Test→per-criterion pass/fail; real sim engine | complete — 2026-04-25 |
| S4 | one complete playable scenario | tutorial: intro→edit→test→pass/fail→retry | complete — 2026-04-25 |
| S5 | more scenarios + remaining criteria | tutorial-002 wired; scenarios 2–4; majority_minority/gap/mean-median | current |
| S6 | game infra complete | GAME-007 in-progress save; scenarios 5-7 | backlog |
| S7 | complete $v1 | all 8-12 scenarios; achievements; test anim; about; shippable | backlog |

§SPRINT1 [COMPLETE 2026-04-25]
goal: app renders tutorial-001.json; player paints+undoes; no sim/game-loop yet
outcome: all tickets closed; demo held 2026-04-25; received as "awesome and successful"
demo observations:
  + 30-hex map loads; paint/undo/redo/lean-view/boundaries all work; zippier than spike
  - view toggle label ambiguous (current-state vs destination) → DESIGN-002
  - districts view population gradient dominates district color → DESIGN-003
  + motivated GAME-008 (accessibility)
tickets (all resolved):
  GAME-001 GAME-004 CI-002(Ph1) GAME-002 GAME-003 GAME-005 CI-002(Ph2)
  PRs: #33 #34 #37 #38 #44 #46 #47 #49 #50 #51

§SPRINT2 [COMPLETE]
goal: editing experience complete; real-time validity feedback
outcome: all tickets closed; live pop-balance ±% per dist; contiguity BFS; unassigned count;
  $pc hover tooltip in sidebar; county border toggle; reset+confirm; view toggle label fixed
tickets (all resolved): DESIGN-002 GAME-009 GAME-010 GAME-011 GAME-012 GAME-013
PRs: #55 #57 #59 #61 #63 #65

§SPRINT3 [COMPLETE]
goal: player runs Test; sees per-criterion pass/fail; real sim engine
outcome: all tickets closed; election sim (pop-weighted vote shares, seat plurality);
  evaluators: population_balance seat_count district_count safe_seats competitive_seats compactness;
  submit button gated on submittability; pass/fail result screen with per-criterion rows
  stubs remaining for S5: majority_minority efficiency_gap mean_median
tickets (all resolved): GAME-017
PRs: #74

§SPRINT4 [COMPLETE]
goal: tutorial scenario fully playable end-to-end
outcome: all tickets closed; full-screen intro slides (narrative, Skip/Prev/Next/Start);
  pass/fail screen + "Keep Drawing" + "Next Scenario" actions
  NOTE: scenario select screen + sequential unlock + localStorage completion tracking
    pulled forward from S6 as part of GAME-018; in-progress save (GAME-007) deferred+open
tickets (all resolved): GAME-016 GAME-018
PRs: #71 #77

§SPRINT5 [CURRENT]
goal: 3+ playable scenarios; all planned criterion types implemented; tutorial-002 wired
scope:
  wire tutorial-002.json into SCENARIO_MANIFEST; verify 196-pc scenario + select screen
  implement stub evaluators: majority_minority(min_eligible_share) efficiency_gap mean_median
  author scenarios 2-4: "Give the Governor a Win" "The Packing Problem" "Cracking the Opposition"
  confirm select+unlock works with multiple real scenarios
  perf check: 196 pcs well within 800 SVG limit; note if degraded
open questions to resolve before authoring S2-4:
  OQ9: StateContext redesign — needed for state-level dist view; deferrable if S2-4 don't require it
candidate IDs: GAME-019(wire tutorial-002) GAME-020(criterion stubs) GAME-021/022/023(scenarios 2/3/4)

§SPRINT6 (backlog)
goal: game infra complete; player persistence; 7 scenarios
scope:
  GAME-007: in-progress save/resume — draft assignments→localStorage; restore on return
  scenarios 5-7: "A Voice for the Valley" "Harden the Map" "The Reform Map"
  main menu screen (assess if select screen already serves this)
  perf pass: confirm all scenarios ≤800 pcs
NOTE: select screen+unlock+completion tracking already done in S4; S6 scope narrower than planned

§SPRINT7 (backlog)
remaining scenarios 8(Both Sides Unhappy) 9(Cats vs Dogs) + design-gap scenarios
Test sequence animation (governor/legislature/lobby icons)
achievement/star UX (pending DESIGN-001 research)
About page
perf pass: confirm ≤800 pcs pure SVG | Canvas+SVG hybrid if exceeded
GAME-006 if not done earlier

§BACKLOG (not sprint-assigned)
GAME-006  scenario compression          S5/S6/S7
GAME-007  player progress persistence   S6
GAME-008  accessibility                 any
DESIGN-003 districts view color encoding any
DESIGN-004 legend layout               any
CI-001    GH Action ticket-close sync   any (low priority)
LEGAL-001 content presentation risk     before public release
DIST-001  Steam deployment research     before distribution decision
DESIGN-001 achievement/star ergonomics  before S7 UX work

§BLOCKING_OPEN_QUESTIONS
OQ9 StateContext redesign → may block S5 scenario authoring (deferrable if scenarios 2-4 don't need state view)
DESIGN-001 star/achievement UX → blocks S7
RESOLVED: OQ4 narrative asset resolution — intro shipped without image support; deferred indefinitely

§REFS
vision: thoughts/shared/vision/game-vision.compressed.md
tickets: thoughts/shared/tickets/TICKETS.md
scenario spec: thoughts/shared/decisions/2026-04-24-scenario-data-format.compressed.md
