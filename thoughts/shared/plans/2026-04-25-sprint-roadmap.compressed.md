<!--COMPRESSED v1; source:2026-04-25-sprint-roadmap.md-->
§META
date:2026-04-25 last_updated:2026-04-27 status:active type:sprint-roadmap
LIVING DOC — update at sprint start (fill tickets) + after demo (outcomes, re-evaluate next)

§ABBREV
sp=sprint S1=Sprint1 … S8=Sprint8
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
| S5 | more scenarios + remaining criteria | tutorial-002 wired; scenarios 2–4; majority_minority/gap/mean-median | complete — 2026-04-26 |
| S6 | game infra + scenarios 5–7 | GAME-007 save/resume; scenarios 5–9; hex-of-hexes; demo feedback fixes | complete — 2026-04-27 |
| S7 | shippable $v1 | about page; wrap-up screen; hex backport 002–006; visual consistency | complete — 2026-04-28 |
| S8 | polish | test anim; achievements; compression; accessibility; animated criteria eval | backlog |

§SPRINT1 [COMPLETE 2026-04-25]
goal: app renders tutorial-001.json; player paints+undoes; no sim/game-loop yet
outcome: all tickets closed; demo held 2026-04-25; received as "awesome and successful"
tickets (all resolved): GAME-001 GAME-004 CI-002(Ph1) GAME-002 GAME-003 GAME-005 CI-002(Ph2)
PRs: #33 #34 #37 #38 #44 #46 #47 #49 #50 #51

§SPRINT2 [COMPLETE]
goal: editing experience complete; real-time validity feedback
outcome: all tickets closed; live pop-balance; contiguity BFS; $pc tooltip; county borders; reset+confirm
tickets (all resolved): DESIGN-002 GAME-009 GAME-010 GAME-011 GAME-012 GAME-013
PRs: #55 #57 #59 #61 #63 #65

§SPRINT3 [COMPLETE]
goal: player runs Test; sees per-criterion pass/fail; real sim engine
outcome: all tickets closed; election sim; evaluators: pop_balance seat_count district_count safe_seats competitive_seats compactness
  stubs remaining for S5: majority_minority efficiency_gap mean_median
tickets (all resolved): GAME-017
PRs: #74

§SPRINT4 [COMPLETE]
goal: tutorial scenario fully playable end-to-end
outcome: all tickets closed; full-screen intro slides; pass/fail screen; scenario select+unlock+completion pulled forward from S6
tickets (all resolved): GAME-016 GAME-018
PRs: #71 #77

§SPRINT5 [COMPLETE 2026-04-26]
goal: 3+ playable scenarios; all planned criterion types implemented; tutorial-002 wired
outcome: all tickets closed; tutorial-002 wired; scenarios 002-004 authored; majority_minority+efficiency_gap+mean_median implemented
tickets (all resolved): GAME-019 GAME-021 GAME-022 GAME-023 GAME-024 GAME-025
PRs: #83 #88 #90 #92 #93 #97

§SPRINT6 [COMPLETE 2026-04-27]
goal: player persistence; 7+ scenarios; hex-of-hexes shape; demo polish
outcome: all tickets closed; GAME-007 save/resume; scenarios 005-009 authored (Valle Verde, Harden the Map,
  Reform Map, Both Sides Unhappy, Cats vs Dogs); hex-of-hexes R=6 for 007-009; dynamic party adapter;
  demo feedback: responsive select, demographics hover, debug force-win, WIP guard+flush, back button,
  reset campaign, URL lock gate, Continue priority
tickets (all resolved): GAME-007 GAME-026 GAME-027
PRs: #102 #103 #104 #105

§SPRINT7 [COMPLETE 2026-04-28]
goal: shippable $v1 — player can visit and have complete consistent experience
outcome: all tickets closed; about page w/ educational framing+designer credit (GAME-029);
  wrap-up screen after final scenario (GAME-020); hex backport to scenarios 002-006+tutorial-002
  (GAME-028); corridor narrowed for s004; GAME-032 filed for loader errors
tickets (all resolved): GAME-020 GAME-028 GAME-029
PRs: #107 #108 #109 #110 #114

§SPRINT8 (backlog)
goal: polish — animations, achievements, optimization, accessibility
scope:
  test sequence animation (governor/legislature/lobby icons)
  achievement/star UX (blocked on DESIGN-001 research)
  animated criteria evaluation + party reactions + election wind-up (needs ticket)
  electoral outcome visual diff (needs ticket)
  GAME-006 scenario compression
  GAME-008 accessibility pass
  DESIGN-005/006/007 demographic overlays
  DESIGN-008 geographic features (lakes, mountains)
  performance pass (≤800 $pcs SVG | Canvas+SVG hybrid)
known tickets: GAME-006 GAME-008 DESIGN-001 DESIGN-005 DESIGN-006 DESIGN-007 DESIGN-008

§BACKLOG (not sprint-assigned)
BUILD-003 ts-rules spawn strategy          any
BUILD-004 playwright bzl macro             any
CI-001    GH Action ticket-close sync      any (low priority)
AGENT-003 infra PR review bot              any
DESIGN-004 legend layout                   any
LEGAL-001 content presentation risk        before public release
DIST-001  Steam deployment research        before distribution decision

§BLOCKING_OPEN_QUESTIONS
DESIGN-001 star/achievement UX → blocks S8
RESOLVED: OQ4 narrative asset resolution — deferred indefinitely
RESOLVED: OQ9 StateContext redesign — deferrable past $v1
