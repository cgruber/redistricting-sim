---
date: 2026-04-25
status: active
type: sprint-roadmap
last_updated: 2026-04-26
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
| 5 | More scenarios + remaining criteria | tutorial-002 wired; scenarios 2–4 authored; majority_minority/gap/mean-median implemented | current |
| 6 | Game infrastructure complete | In-progress save/resume (GAME-007); scenarios 5–7 authored | backlog |
| 7 | Complete v1 | All 8–12 scenarios; achievements UX; test animation; about page; shippable | backlog |

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

## Sprint 5 — More Scenarios + Remaining Criteria [CURRENT]

**Goal**: At least three scenarios are playable. All planned criterion types
implemented. tutorial-002 (196-precinct) wired into the manifest.

**Scope**:

- Wire `tutorial-002.json` into `SCENARIO_MANIFEST` in `main.ts`; verify the
  196-precinct scenario loads and the select screen shows two entries
- Implement the three stub criterion evaluators:
  - `majority_minority` (uses `min_eligible_share` + scenario eligibility_rules)
  - `efficiency_gap`
  - `mean_median`
- Author scenarios 2–4 as JSON (scenario names from vision: "Give the Governor
  a Win", "The Packing Problem", "Cracking the Opposition")
- Scenario-to-scenario transition already works (select screen + unlock is done);
  confirm it works with multiple real scenarios
- Performance check: tutorial-002 has 196 precincts (well within 800 SVG limit);
  note but do not act unless degraded

**Open questions that must be resolved before authoring scenarios 2–4**:
- OQ9: StateContext redesign — needed if any new scenario requires state-level
  district view (may be deferrable if scenarios 2–4 don't require it)

**Known tickets**: None open that map to this sprint yet — create at sprint start.
Candidate IDs: GAME-019 (wire tutorial-002), GAME-020 (criterion stubs),
GAME-021/022/023 (scenarios 2/3/4).

---

## Sprint 6 — Game Infrastructure Complete [BACKLOG]

**Goal**: The game feels like a real game. Player persistence; seven scenarios.

**Scope**:
- GAME-007: In-progress session save/resume — save draft district assignments
  to localStorage; restore on return; distinguish from completion tracking
- Scenarios 5–7: "A Voice for the Valley", "Harden the Map", "The Reform Map"
- Main menu screen (optional: assess whether select screen already serves this)
- Performance pass: confirm all scenarios ≤ 800 precincts

**Known tickets**: GAME-007. Remainder TBD at sprint planning.

**Note**: Scenario select screen, sequential unlock, and completion tracking
were already implemented in Sprint 4. Sprint 6 scope is now narrower than
originally planned.

---

## Sprint 7 — Complete v1 [BACKLOG]

**Goal**: Shippable v1. All scenarios, polish, about page.

**Scope**:
- Remaining scenarios: 8 (Both Sides Unhappy), 9 (Cats vs. Dogs), plus
  any additional scenarios needed to fill the design gap (see vision §SCENARIOS)
- Test sequence animation (governor/legislature/lobby icons — see vision §TEST)
- Achievement/optional criteria UX (star display or equivalent; see DESIGN-001)
- About page
- Performance pass: confirm all scenarios ≤ 800 precincts (pure SVG) or
  implement Canvas+SVG hybrid if needed
- GAME-006 (scenario compression) if not resolved earlier

**Known tickets**: GAME-006 (if not Sprint 5/6), DESIGN-001.
Remainder TBD at sprint planning.

---

## Backlog (not sprint-assigned)

| Ticket | Area | Sprint target |
|---|---|---|
| GAME-006 | Scenario compression | Sprint 5, 6, or 7 |
| GAME-007 | Player progress persistence (in-progress save) | Sprint 6 |
| GAME-008 | Accessibility | Any sprint |
| DESIGN-003 | Districts view color/population encoding | Any sprint |
| DESIGN-004 | Legend layout (horizontal strip above map) | Any sprint |
| CI-001 | GitHub Action ticket-close sync | Any (low priority) |
| LEGAL-001 | Content presentation risk research | Before public release |
| DIST-001 | Steam deployment research | Before distribution decision |
| DESIGN-001 | Achievement/star system ergonomics | Before Sprint 7 UX work |

---

## Open Spec Questions That Will Block Implementation

| Question | Blocks | ADR/spec reference |
|---|---|---|
| OQ9: StateContext redesign | Sprint 5/6 (state-level view infra; may be deferrable) | scenario-data-format.md OQ9 |
| DESIGN-001: Star/achievement UX | Sprint 7 | DESIGN-001 ticket |

**Resolved**: OQ4 (narrative asset resolution) — intro slides shipped in Sprint 4
without image support; image handling deferred indefinitely.
