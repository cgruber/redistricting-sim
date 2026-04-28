---
date: 2026-04-25
status: active
type: sprint-roadmap
last_updated: 2026-04-28
---

# Sprint Roadmap — Redistricting Simulator v1

## About This Document

Living document. Updated at the start of each sprint (tickets filled in) and
after each sprint demo (outcomes noted, next sprint re-evaluated). Sprints are
**checkpoint-based, not time-boxed** — velocity is unknown; a sprint is done when
its demo target is met, not when a clock runs out.

Tickets for the *current* sprint are planned in detail before work begins.
Future sprint tickets are sketched; they are sprint-planned in full when the
previous sprint closes. This keeps the roadmap honest about what we know vs.
what we're projecting.

---

## v1 Goal

A playable browser game with 8–12 scenarios teaching gerrymandering mechanics.
Single player, desktop-first, fictional regions, FPTP only. Local progress
storage; no user accounts; no server game state.

See `thoughts/shared/vision/game-vision.compressed.md` for full scope.

---

## Sprint Overview

| Sprint | Goal | Demo target | Status |
|---|---|---|---|
| 1 | Load and display a real scenario | Tutorial map renders from JSON; player can paint districts | complete — 2026-04-25 |
| 2 | Edit the map + live feedback | Live population balance, contiguity indicators, precinct tooltip | complete — 2026-04-25 |
| 3 | Test the map | Hit Test → per-criterion pass/fail; real simulation engine | complete — 2026-04-25 |
| 4 | One complete playable scenario | Tutorial scenario: intro → edit → test → pass/fail → retry | complete — 2026-04-25 |
| 5 | More scenarios + remaining criteria | tutorial-002 wired; scenarios 2–4 authored; majority_minority/gap/mean-median implemented | complete — 2026-04-26 |
| 6 | Game infrastructure + scenarios 5–7 | In-progress save/resume; scenarios 5–7 authored; hex-of-hexes for 007–009 | complete — 2026-04-27 |
| 7 | Shippable v1 | About page; wrap-up screen; hex backport to 002–006; all scenarios visually consistent | complete — 2026-04-28 |
| 8 | Hardening | CSP, extract CSS, loader error handling, scenario compression | complete — 2026-04-28 |
| 9 | First release | Deploy to pastthepost.org; legal review; basic accessibility | current |
| 10 | Design research + polish | Achievement UX, demographic overlays, geographic features, full accessibility | backlog |

---

## Sprint 1 — Load and Display a Real Scenario [COMPLETE 2026-04-25]

**Goal**: The app renders a real scenario from a JSON file. The player can see
the hex map, paint districts, undo/redo, and toggle the partisan lean view.
No simulation or game loop yet.

**Outcome**: All tickets closed; demo held 2026-04-25; received as "awesome and
successful". 30-hex map loads; paint/undo/redo/lean-view/boundaries all work.
Demo observations: view toggle label ambiguous (→ DESIGN-002); districts view
population gradient dominated district color (→ DESIGN-003); motivated
GAME-008 (accessibility).

**Tickets**: GAME-001, GAME-004, GAME-002, GAME-003, GAME-005, CI-002 (Ph1+Ph2)
PRs: #33 #34 #37 #38 #44 #46 #47 #49 #50 #51

---

## Sprint 2 — Edit the Map + Live Feedback [COMPLETE]

**Goal**: The editing experience is complete. The player gets real-time feedback
on map validity without running the full simulation.

**Outcome**: All tickets closed. Live population balance ±% per district,
contiguity BFS check, unassigned count, precinct hover tooltip in sidebar,
county border overlay toggle, reset-to-initial with confirmation, view toggle
label convention fixed (destination not current state).

**Tickets**: DESIGN-002, GAME-009, GAME-010, GAME-011, GAME-012, GAME-013
PRs: #55 #57 #59 #61 #63 #65

---

## Sprint 3 — Test the Map [COMPLETE]

**Goal**: The player can run Test and see which success criteria pass or fail.
Introduces the real simulation engine.

**Outcome**: All tickets closed. Election sim engine (population-weighted vote
shares, seat plurality); criteria evaluators for `population_balance`,
`seat_count`, `district_count`, `safe_seats`, `competitive_seats`,
`compactness`. Submit button gated on submittability. Pass/fail result screen
with per-criterion rows. Three criteria types remain as stubs for Sprint 5:
`majority_minority`, `efficiency_gap`, `mean_median`.

**Tickets**: GAME-017 (covered sim engine + submit + result screen)
PRs: #74

---

## Sprint 4 — One Complete Playable Scenario [COMPLETE]

**Goal**: The tutorial scenario is fully playable end-to-end. The game loop is
complete for one scenario.

**Outcome**: All tickets closed. Full-screen intro slides (narrative character,
objective, slide sequence, Skip/Prev/Next/Start). Pass/fail screen with
"Keep Drawing" and "Next Scenario" actions. **Scenario select screen, sequential
unlock logic, and localStorage completion tracking were implemented here as
well** — pulled forward from Sprint 6 as part of GAME-018. In-progress save
(GAME-007) was explicitly deferred and remains open.

**Tickets**: GAME-016, GAME-018
PRs: #71 #77

---

## Sprint 5 — More Scenarios + Remaining Criteria [COMPLETE 2026-04-26]

**Goal**: At least three scenarios are playable. All planned criterion types
implemented. tutorial-002 (196-precinct) wired into the manifest.

**Outcome**: All tickets closed. tutorial-002 wired with winnability e2e test.
Three new scenarios authored (002 "Give the Governor a Win", 003 "The Packing
Problem", 004 "Cracking the Opposition"). Three criterion evaluators implemented:
`majority_minority`, `efficiency_gap`, `mean_median` — 22 unit tests, all e2e
passing. Scenario select + unlock confirmed working with multiple scenarios.

**Tickets**: GAME-019, GAME-021, GAME-022, GAME-023, GAME-024, GAME-025
PRs: #83 #88 #90 #92 #93 #97

---

## Sprint 6 — Game Infrastructure + Scenarios 5–7 [COMPLETE 2026-04-27]

**Goal**: Player persistence, seven scenarios, hex-of-hexes map shape for new
scenarios.

**Outcome**: All tickets closed. GAME-007 save/resume implemented (WIP to
localStorage with debounced save, restore on return, clear on completion).
Scenarios 005 "Valle Verde" (VRA/majority-minority), 006 "Harden the Map"
(incumbency protection), 007 "The Reform Map" (neutral rules). Scenarios
008 "Both Sides Unhappy" and 009 "Cats vs. Dogs" authored with hex-of-hexes
shape (GAME-027). Dynamic party adapter fix enables arbitrary party names
(cat/dog in 009). Demo feedback fixes: responsive scenario select, demographic
group display in hover panel, debug force-win button (?debug), WIP discard
warning modal, synchronous WIP flush, back-to-scenarios button, reset campaign
button, URL lock gate for locked scenarios, Continue priority over Play Again.

**Tickets**: GAME-007, GAME-026, GAME-027
PRs: #102 #103 #104 #105

---

## Sprint 7 — Shippable v1 [COMPLETE 2026-04-28]

**Goal**: A player can download/visit this and have a complete, consistent
experience. No dead ends, no missing context, no visual inconsistencies.

**Outcome**: All tickets closed. About page with educational framing, designer
credit ("Christian Edward Jackson-Gruber and Claude"), and resource links
(GAME-029). Wrap-up/congratulations screen after completing the final scenario
(GAME-020). Hex-of-hexes backport to scenarios 002–006 + tutorial-002: all maps
now render as hexagonal/circular shapes (GAME-028). Tutorial-001 left as-is
(already compact at 30 precincts). Scenario-004 corridor narrowed from |r|≤1 to
r=0 to make cracking mechanically viable. GAME-032 filed for loader error handling
improvements discovered during backport.

**Tickets**: GAME-020, GAME-028, GAME-029
PRs: #107 #108 #109 #110 #114

---

## Sprint 8 — Hardening [COMPLETE 2026-04-28]

**Goal**: Production-ready infrastructure — security, error handling,
optimization. No new features, no research.

**Outcome**: All tickets closed. CSP meta tag added with temporary
`'unsafe-inline'` for scripts and styles (BUILD-005). Inline `<style>` block
(747 lines) extracted to external `styles.css` (BUILD-006). User-visible error
screen for scenario load failures with scenario ID, error message, and back
button (GAME-032). Scenario compression resolved as no-code-change: HTTP gzip
is sufficient for v1 delivery; `.scenarioz` deferred to community scenarios
(GAME-006).

**Tickets**: BUILD-005, BUILD-006, GAME-032, GAME-006
PRs: #119 #120 #121 #122

---

## Sprint 9 — First Release [CURRENT]

**Goal**: Ship v1 to the public. Deploy, legal review, basic accessibility.

**Scope**:
- **DIST-001**: Deploy to pastthepost.org (or GH Pages as staging). Static
  hosting; gzip served automatically. Configure DNS for pastthepost.org +
  pastthepost.gg redirect.
- **LEGAL-001**: Quick review of content presentation risks. The game is
  educational, non-partisan, fictional regions — assess what disclaimers or
  framing are needed before public release.
- **Basic accessibility**: Keyboard navigation for district selection and
  precinct painting. ARIA labels on interactive elements. Subset of GAME-008
  scoped to release-blocking items only.

**Known tickets**: DIST-001, LEGAL-001, GAME-008 (partial).

---

## Sprint 10 — Design Research + Polish [BACKLOG]

**Goal**: Research-first sprint — resolve open design questions, then implement.

**Scope**:
- DESIGN-001: Achievement/star UX research (blocks animated criteria eval)
- DESIGN-005/006/007: Demographic overlay research → implementation
- DESIGN-008: Geographic features (lakes, mountains as decorative tiles)
- GAME-008: Full accessibility pass (remainder after S9 basics)
- GAME-031: Gameplay critique followup (review + act on external feedback)
- Animated criteria evaluation + party reactions (needs ticket; blocked on DESIGN-001)
- Electoral outcome visual diff (needs ticket)

**Known tickets**: DESIGN-001, DESIGN-005, DESIGN-006, DESIGN-007, DESIGN-008,
GAME-008, GAME-031. Two new tickets needed for animated criteria + electoral diff.

---

## Sprint 11+ (later)

| Ticket | Area | Notes |
|---|---|---|
| GAME-030 | Main menu + campaigns | Architecture overhaul; own sprint |

---

## Backlog (not sprint-assigned)

| Ticket | Area | Sprint target |
|---|---|---|
| BUILD-003 | ts-rules spawn strategy research | Any |
| BUILD-004 | Playwright bzl macro | Any |
| CI-001 | GitHub Action ticket-close sync | Any (low priority) |
| AGENT-003 | Infra PR review bot comment handling | Any |
| DESIGN-004 | Legend layout (horizontal strip above map) | Any |

---

## Open Spec Questions That Will Block Implementation

| Question | Blocks | ADR/spec reference |
|---|---|---|
| DESIGN-001: Star/achievement UX | Sprint 9 | DESIGN-001 ticket |

**Resolved**:
- OQ4 (narrative asset resolution) — intro slides shipped in Sprint 4 without image support; deferred indefinitely.
- OQ9 (StateContext redesign) — scenarios 2–9 authored without state-level view; deferrable past v1.
