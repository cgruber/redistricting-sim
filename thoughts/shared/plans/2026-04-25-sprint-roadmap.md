---
date: 2026-04-25
status: active
type: sprint-roadmap
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
| 1 | Load and display a real scenario | Tutorial map renders from JSON; player can paint districts | planned |
| 2 | Edit the map + live feedback | Live population balance, contiguity indicators, precinct tooltip | backlog |
| 3 | Test the map | Hit Test → per-criterion pass/fail; real simulation engine | backlog |
| 4 | One complete playable scenario | Tutorial scenario: intro → edit → test → pass/fail → retry | backlog |
| 5 | More criteria + scenarios 2–4 | Demographic events; majority_minority/efficiency_gap criteria; 4 playable | backlog |
| 6 | Game infrastructure + scenarios 5–7 | Scenario select, unlock, persistence ("Continue"); 7 playable | backlog |
| 7 | Complete v1 | All 8–12 scenarios; achievements UX; test animation; about page; shippable | backlog |

---

## Sprint 1 — Load and Display a Real Scenario

**Goal**: The app renders a real scenario from a JSON file. The player can see
the hex map, paint districts, undo/redo, and toggle the partisan lean view.
No simulation or game loop yet.

**Demo**: Open browser via `serve.sh`. Tutorial scenario loads, hex map visible,
precincts rendered at correct positions. Player can paint districts and undo.

**Tickets** (execute in dependency order):

| Ticket | Title | Notes |
|---|---|---|
| GAME-001 | Scenario TypeScript types | No dependencies; do first |
| GAME-004 | MapRenderer interface extraction | No dependencies; parallel with GAME-001 |
| GAME-002 | Scenario JSON loader + validator | Depends on GAME-001 |
| GAME-003 | Tutorial scenario content | Depends on GAME-001 (types), GAME-002 (validator); sketch proposal first |
| GAME-005 | Sprint 1 integration | Depends on all above; this is the demo |

**GAME-001 and GAME-004 can proceed in parallel.** Once GAME-001 is done,
GAME-002 begins. GAME-003 Phase 1 (the written sketch) can also start once
GAME-001 is done — it does not need the validator. GAME-003 Phase 2 (full JSON
authoring) requires GAME-002 to be complete (so the scenario can be validated).
GAME-005 is last.

DAG: `GAME-001 ∥ GAME-004 → GAME-002 → GAME-003 (Phase 2) → GAME-005`
Note: GAME-003 Phase 1 (sketch) can start alongside GAME-002.

---

## Sprint 2 — Edit the Map + Live Feedback

**Goal**: The editing experience is complete. The player gets real-time feedback
on map validity without running the full simulation.

**Planned scope** (tickets to be created at sprint planning):
- Live population balance per district (% deviation from target shown per district)
- Contiguity validation — highlight non-contiguous district segments
- Precinct tooltip on hover (population, demographic summary, current district)
- County border overlay toggle (wires up `setCountyBordersVisible` from GAME-004)
- Brush size controls (already partially in spike; needs scenario-aware refinement)
- Reset to initial state button

**Not yet ticketed** — sprint plan written before Sprint 2 begins.

---

## Sprint 3 — Test the Map

**Goal**: The player can run Test and see which success criteria pass or fail.
Introduces the real simulation engine (demographic group model, events).

**Planned scope**:
- Election simulation engine replacing spike's simplified version
  - Group model: `population_share × voter_eligible × turnout_rate × vote_shares`
  - Demographic events applied before simulation
  - Pure function; fully unit-testable
- Criterion evaluators: `population_balance`, `seat_count`, `district_count`
  (the types present in tutorial scenario — enough for Sprint 3 demo)
- Basic Test sequence UI: per-criterion pass/fail list (placeholder animation;
  real governor/legislature animation is Sprint 7)
- Scenario compression (GAME-006) evaluated and addressed this sprint or deferred

**Not yet ticketed.**

---

## Sprint 4 — One Complete Playable Scenario

**Goal**: The tutorial scenario is fully playable end-to-end. The game loop is
complete for one scenario.

**Planned scope**:
- Scenario intro slides UI (character framing, narrative context)
- Success screen (required criteria all passed; optional criteria status)
- Failure/feedback screen (which criteria failed; return to editing)
- Retry loop
- MapRenderer interface: confirm Canvas+SVG hybrid threshold is not yet hit;
  defer Canvas implementation if all scenarios stay ≤ 800 precincts

**Not yet ticketed.**

---

## Sprint 5 — More Criteria + Scenarios 2–4

**Goal**: Four scenarios are playable. All common criterion types implemented.

**Planned scope**:
- Additional criterion evaluators: `majority_minority` (uses `min_eligible_share`
  and eligibility_rules), `efficiency_gap`, `mean_median`, `compactness`,
  `safe_seats`, `competitive_seats`
- Scenarios 2 (Give the Governor a Win), 3 (The Packing Problem),
  4 (Cracking the Opposition) — authored as JSON
- Scenario-to-scenario transition (completing one shows the next is unlocked;
  no persist yet — that's Sprint 6)

**Not yet ticketed.**

---

## Sprint 6 — Game Infrastructure + Scenarios 5–7

**Goal**: The game feels like a real game. Progression, persistence, scenario
select screen. Seven scenarios playable.

**Planned scope**:
- Scenario select screen (completed / next unlocked / locked visible)
- Sequential unlock: completing scenario N unlocks N+1
- Player progress persistence (GAME-007): in-progress session save/resume,
  completion tracking, "Continue" from main menu
- Main menu screen
- Scenarios 5 (A Voice for the Valley), 6 (Harden the Map), 7 (The Reform Map)

**Known tickets**: GAME-007. Remainder TBD.

---

## Sprint 7 — Complete v1

**Goal**: Shippable v1. All scenarios, polish, about page.

**Planned scope**:
- Remaining scenarios: 8 (Both Sides Unhappy), 9 (Cats vs. Dogs), plus
  any additional scenarios needed to fill the design gap (see vision §SCENARIOS
  note about needing 1+ scenarios complicating the reform narrative)
- Test sequence animation (governor/legislature/lobby icons — see vision §TEST)
- Achievement/optional criteria UX (star display or equivalent; see DESIGN-001)
- About page
- Performance pass: confirm all scenarios ≤ 800 precincts (pure SVG) or
  implement Canvas+SVG hybrid if needed
- Scenario compression (GAME-006) confirmed/implemented if not done in Sprint 3

**Known tickets**: GAME-006 (if not Sprint 3), DESIGN-001 (research informs UX).
Remainder TBD.

---

## Backlog (not yet sprint-assigned)

These tickets exist but are not assigned to a sprint. They will be slotted in
at sprint planning for the appropriate sprint.

| Ticket | Area | Sprint target |
|---|---|---|
| GAME-006 | Scenario compression | Sprint 3 or 7 |
| GAME-007 | Player progress persistence | Sprint 6 |
| CI-001 | GitHub Action ticket-close sync | Any (infrastructure; low priority) |
| LEGAL-001 | Content presentation risk research | Before any public release |
| DIST-001 | Steam deployment research | Before distribution decision |
| DESIGN-001 | Achievement/star system ergonomics | Before Sprint 7 UX work |

---

## Open Spec Questions That Will Block Implementation

These open questions from the scenario data format spec need resolution before
the relevant sprint begins. Flagged here so they don't get lost.

| Question | Blocks | ADR/spec reference |
|---|---|---|
| OQ4: Narrative asset resolution strategy (Slide.image path vs. key) | Sprint 4 (intro slides) | scenario-data-format.md OQ4 |
| OQ9: StateContext redesign | Sprint 5/6 (state-level view infrastructure) | scenario-data-format.md OQ9 |
| DESIGN-001: Star/achievement UX | Sprint 7 | DESIGN-001 ticket |
