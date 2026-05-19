<!--COMPRESSED v1; source:2026-04-25-sprint-roadmap.md-->
§META
date:2026-04-25 last_updated:2026-05-18 status:active type:sprint-roadmap
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
| S8 | hardening | CSP; extract CSS; loader errors; scenario compression | complete — 2026-04-28 |
| S9 | first release | deploy pastthepost.org; legal review; basic a11y | complete — 2026-04-29 |
| S10 | code quality + tidy | test coverage gaps; dedup; extract modules; refactor for polish readiness | complete — 2026-04-29 |
| S11 | main menu, campaigns + polish | title screen→campaign select→scenario flow; Tier2: design research, a11y | complete — 2026-05-02 |
| S12 | character reactions + submit-on-invalid | result screen characters animate+react; audio; allow invalid map submission; deferred verdict+stars | complete — 2026-05-18 |
| S13 | gameplay polish + scenario depth | tutorial walkthroughs; VRA scenarios; terrain features; scenario-002 tuning | planned |
| S14 | code quality | split loader; break up main.ts; unify type systems | sketched |

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

§SPRINT8 [COMPLETE 2026-04-28]
goal: hardening — security, error handling, optimization; no new features
outcome: all tickets closed; CSP meta tag w/ temp unsafe-inline (BUILD-005); inline styles→styles.css
  (BUILD-006); user-visible error screen for load failures (GAME-032); HTTP gzip sufficient for v1,
  no code changes (GAME-006)
tickets (all resolved): BUILD-005 BUILD-006 GAME-032 GAME-006
PRs: #119 #120 #121 #122

§SPRINT9 [COMPLETE 2026-04-29]
goal: first release — ship v1 to public
outcome: all tickets closed
  DIST-001: prepare-release.sh + deploy.sh (manual staging+prod); Buildkite auto-deploy drafted in #127 but dropped in #131 rewrite; PRs #127 #131 #132
  LEGAL-001: content risk low; disclaimers added to about page + Valle Verde; PR #126
  GAME-008(partial): keyboard nav (painting+scenario select); ARIA labels; PR #129
  standalone fix: scenario-select always shown on initial load; PR #128
tickets: DIST-001 LEGAL-001 GAME-008(partial)
PRs: #126 #127 #128 #129 #131 #132

§SPRINT10 [COMPLETE 2026-04-29]
goal: code quality + tidy — close test coverage gaps, eliminate duplication, extract modules
outcome: all tier1+tier2 tickets closed
tier1: BUILD-007(#134) GAME-033(#135) GAME-034(#136) GAME-035(#138) GAME-036(#140) GAME-037(#142) GAME-040(#144)
tier2: GAME-039(#149) GAME-038(#151)
deferred(tier3): GAME-041 GAME-042 GAME-043 — too large for tidy sprint

§SPRINT11 [COMPLETE 2026-05-02]
goal: main menu, campaigns + polish — proper title screen, campaign navigation model
outcome: all tier1+tier2 tickets closed
  tier1: GAME-047(#159) GAME-048(#162) GAME-049(#169) GAME-050(#165) GAME-051(#175)
  tier2: DESIGN-001 achievement UX research; GAME-008 full a11y pass; GAME-031 critique;
    GAME-052 animated criteria reveal (CSS @keyframes, click-to-skip, 🎉/💔 placeholder, 4 e2e tests; #189)
  deferred: GAME-053 electoral outcome diff → discuss S12 planning; DESIGN-009 open questions resolved in ticket
  new tickets filed for S12: DESIGN-009 GAME-059 GAME-060 GAME-061 GAME-062 GAME-063 GAME-064

§SPRINT12 [COMPLETE 2026-05-18]
goal: character reactions + submit-on-invalid
outcome: all core tickets resolved; GAME-062 all 4 types wired(#227); GAME-073 deferred verdict+stars+tada/womp-womp(#236 #237); GAME-065+GAME-071 moved to S13 stretch
resolved: DESIGN-009 DESIGN-011 GAME-059 GAME-060 GAME-061 GAME-062 GAME-063 GAME-064 GAME-066 GAME-067 GAME-068 GAME-069 GAME-073
PRs: #192 #194 #196 #212 #213 #214 #215 #225 #226 #227 #228 #236 #237

§SPRINT13 (planned)
goal: gameplay polish + scenario depth
demo target: district demographic rollup live; 5-district layout no scroll; tutorial-001 guided; terrain features available
priority note: VRA scenarios motivate sprint but can slip to S15/Backlog (S14=code-quality only); UI improvements are primary deliverable; Valle Verde tests GAME-080
tier1-UI:
  DESIGN-014 (non-partisan framing guidelines + about-page/Valle-Verde audit; prereq for scenario narrative authoring)
  GAME-080 (district demographic rollup: live % derived from criteria; compact stat under district button)
  DESIGN-015 (information density redesign: 5-district overflow; layout options; GAME-080 stat placement; DESIGN-004 fate)
  GAME-081 (implement information density; trails DESIGN-015)
tier1-content:
  DESIGN-008 (expanded: terrain model — tiles+edge rivers+precinct annotations+rendering+validity rules)
  GAME-075 (terrain implementation: schema+generator+renderer+contiguity; ≥1 terrain scenario)
  DESIGN-012 (tutorial overlay UX design)
  GAME-076 (tutorial-001 guided walkthrough: overlay engine + 9-step script)
  GAME-077 (tutorial-002 guided mode; trails GAME-076)
tier2 (can slip to S15/Backlog — S14 is code-quality only):
  DESIGN-013 (VRA scenario design; trails DESIGN-014)
  GAME-078 (VRA scenarios; trails DESIGN-013+GAME-075)
  GAME-079 (scenario-002 playability tuning)
stretch: GAME-065(art refinement) GAME-071(audio fine-tuning)
research: thoughts/shared/research/2026-05-18-vra-legal-political-landscape.md

§SPRINT14 (sketched)
goal: code quality — split modules, unify type systems
tickets: GAME-041 split loader; GAME-042 break up main.ts; GAME-043 unify type systems; GAME-046 panels unit tests
rationale: isolated sprint; no feature work mixed in; large refactors need focused review

§BACKLOG (not sprint-assigned)
BUILD-003 ts-rules spawn strategy          any
BUILD-004 playwright bzl macro             any
BUILD-008 switch CI to pnpm               any (low priority)
CI-001    GH Action ticket-close sync      any (low priority)
AGENT-003 infra PR review bot              any
DESIGN-004 legend layout                   any
DESIGN-005 population dot-density overlay  S14+
DESIGN-006 zoom-adaptive dot density       S14+
DESIGN-007 dimensional dot map overlay     S14+
DESIGN-008 geographic features             S14+
GAME-041  split loader.ts                  S14
GAME-042  break up main.ts                 S14
GAME-043  unify type systems               S14
GAME-046  panels unit tests                S14
GAME-053  electoral outcome visual diff    S13+
GAME-056  playtest feedback                any
GAME-057  scenario randomization           any
GAME-058  manual playability test          any
GAME-030  main menu+campaigns (remaining)  S14+

§BLOCKING_OPEN_QUESTIONS
RESOLVED: DESIGN-009 art model → PNG sprite sheets; 3 eval states (approve/neutral/disapprove); governor done
RESOLVED: DESIGN-001 star/achievement UX → resolved; GAME-052 shipped with emoji placeholder
RESOLVED: OQ4 narrative asset resolution — deferred indefinitely
RESOLVED: OQ9 StateContext redesign — deferrable past $v1
