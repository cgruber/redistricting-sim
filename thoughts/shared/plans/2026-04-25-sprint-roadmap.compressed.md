<!--COMPRESSED v1; source:2026-04-25-sprint-roadmap.md-->
§META
date:2026-04-25 status:active type:sprint-roadmap
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
| S2 | edit map + live feedback | live pop-balance, contiguity, $pc tooltip | backlog |
| S3 | test the map | Test→per-criterion pass/fail; real sim engine | backlog |
| S4 | one complete playable scenario | tutorial: intro→edit→test→pass/fail→retry | backlog |
| S5 | more criteria + scenarios 2-4 | events; majority_minority/gap criteria; 4 playable | backlog |
| S6 | game infra + scenarios 5-7 | $sp-select, unlock, persist (Continue); 7 playable | backlog |
| S7 | complete $v1 | all 8-12 scenarios; achievements; test anim; about; shippable | backlog |

§SPRINT1 [COMPLETE 2026-04-25]
goal: app renders tutorial-001.json; player paints+undoes; no sim/game-loop yet
outcome: all tickets closed; demo held 2026-04-25; received as "awesome and successful"
demo observations:
  + 30-hex map loads; paint/undo/redo/lean-view/boundaries all work; zippier than spike
  - view toggle label ambiguous (current-state vs destination) → DESIGN-002
  - districts view population gradient dominates district color → DESIGN-003
  + motivated GAME-008 (accessibility) ticket for color-blind palettes + screen reader
tickets (all resolved):
  GAME-001 GAME-004 CI-002(Ph1) GAME-002 GAME-003 GAME-005 CI-002(Ph2)
  PRs: #33 #34 #37 #38 #44 #46 #47 #49 #50 #51

§SPRINT2 (backlog)
goal: edit map + live feedback
tickets:
  DESIGN-002 view-toggle label fix (destination not current)
  GAME-009 pan+zoom (d3.zoom; scroll+keyboard; zoom-invariant strokes)
  GAME-010 map validity panel (pop-balance ±%; contiguity; unassigned count)
  GAME-011 precinct info panel (sidebar hover section; replaces status bar)
  GAME-012 county border overlay toggle (flavor; computed from county_id)
  GAME-013 reset-to-initial (confirmation; clears undo history)
deferred: brush size controls (not sprint-assigned)

§SPRINT3 (backlog)
real sim engine: group model(pop_share×voter_eligible×turnout×vote_shares); events applied
criterion evaluators: population_balance | seat_count | district_count
basic Test sequence UI (placeholder anim; real anim=S7)
GAME-006 (scenario compression): evaluate+resolve or defer

§SPRINT4 (backlog)
scenario intro slides UI | success screen | failure+feedback screen | retry loop
Canvas+SVG hybrid: assess threshold; defer if all scenarios ≤800 $pcs

§SPRINT5 (backlog)
criterion evaluators: majority_minority(min_eligible_share) | efficiency_gap |
  mean_median | compactness | safe_seats | competitive_seats
scenarios 2(Gov Win) 3(Packing) 4(Cracking) authored+playable
scenario-to-scenario transition (unlock display; no persist yet)

§SPRINT6 (backlog)
scenario select screen | sequential unlock | main menu
GAME-007 player persistence: in-progress save/resume; completion tracking; Continue menu
scenarios 5(VRA) 6(Harden) 7(Reform Map)

§SPRINT7 (backlog)
scenarios 8(Both Sides) 9(Cats+Dogs) + design-gap scenarios
Test sequence animation (governor/legislature/lobby icons)
achievement/star UX (pending DESIGN-001 research)
About page
perf pass: confirm ≤800 $pcs pure SVG | Canvas+SVG hybrid if exceeded
GAME-006 if not done in S3

§BACKLOG (not sprint-assigned)
GAME-006  scenario compression          S3 or S7
GAME-007  player progress persistence   S6
CI-001    GH Action ticket-close sync   any (low priority)
LEGAL-001 content presentation risk     before public release
DIST-001  Steam deployment research     before distribution decision
DESIGN-001 achievement/star ergonomics  before S7 UX work

§BLOCKING_OPEN_QUESTIONS
OQ4 narrative asset resolution (Slide.image) → blocks S4 intro slides
OQ9 StateContext redesign → blocks S5/S6 state-level view infra
DESIGN-001 star/achievement UX → blocks S7

§REFS
vision: thoughts/shared/vision/game-vision.compressed.md
tickets: thoughts/shared/tickets/TICKETS.md
scenario spec: thoughts/shared/decisions/2026-04-24-scenario-data-format.compressed.md
