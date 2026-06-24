---
id: GAME-097
title: Tutorial pipeline migration + tutorial-001 content (hex-circle welcome)
area: game, tooling, content
status: open
created: 2026-06-24
---

## Summary

Migrate the tutorials off the old `gen-tutorial-*.main.kts` generators onto the
map-generation pipeline (`spec.yaml` → JSON) plus pedagogical hand-edits, exactly like
the scenarios. Establish the tutorial-spec conventions and deliver **tutorial-001**'s
new content: a small **hex-circle** "welcome" map that teaches paint + submit.

See plan: `thoughts/shared/plans/2026-06-24-tutorial-redesign-pipeline-migration.md`.

## Current State

- `tutorial-001` (30 precincts, rectangular), `tutorial-002` (196), `tutorial-003` (119)
  are all emitted by `game/scenarios/gen-tutorial-*.main.kts` — no specs, off-pipeline.
- Scenarios already use the pipeline: `scenario-002.spec.yaml` → `generate_scenario` →
  JSON (+ optional finishing overlay).
- The pipeline assumes partisan demographics; tutorials that teach pure game mechanics
  have no electoral content, so the no-partisan path must be validated.

## Approach

- Author `tutorial-001.spec.yaml` and generate `tutorial-001.json` via the pipeline.
- **tutorial-001 spec (locked with user):**
  - `map.shape: hex_circle`, `radius: 3` → **37 precincts** (replaces the 30-precinct
    rectangle; a true circular hex silhouette that halves into two balanced contiguous
    districts).
  - `terrain: {}` (no features — those arrive in tutorial-002).
  - 2 districts; NEUTRAL 50/50 demographics (model requires demographics; T1 never
    surfaces them — `hide_election_results: true` hides the outcome-prediction panel).
  - **No untaught failure modes.** T1 gates on `district_count` *only* (both districts
    used, all assigned — stated plainly in the objective). Balance and contiguity are
    deliberately NOT enforced (no balance criterion; `contiguity: allowed`) so the player
    can never fail for a rule T1 didn't teach — those land in the later "rules" tutorial.
  - The validity panel is **applicable-aware**: it shows a constraint only when the
    scenario gates on it (balance row only with a population_balance criterion; contiguity
    only when not "allowed"). In T1 it renders nothing, so it's hidden. This is a general
    improvement — existing scenarios (all have balance + contiguity) are unchanged.
  - **Paint-only chrome:** `hide_view_toolbar: true` hides the right-side view toolbar
    (no lean/county/city views worth showing in T1) and forces the paint toolbar open
    (without clobbering the saved collapse preference). The **legend is removed game-wide**
    — the paint toolbar (colored, labelled district buttons) now serves as the legend.
- Decide/encode the **tutorial flag** the overlay engine keys on (e.g. `tutorial: true`
  in the scenario block, or campaign-type detection) — coordinate with GAME-076.
- Validate the no-partisan-demographics pipeline path (neutral or omitted demographics);
  ensure loader/adapter/sim accept it.
- Retire `gen-tutorial-*.main.kts` once specs replace them — **check for build-target /
  serving references before deleting** so nothing is orphaned. (Note: no
  `gen-tutorial-001.main.kts` ever existed — tutorial-001 was hand-authored — so T1 has
  no generator to retire; `gen-tutorial-002/003.main.kts` stay until those migrate.)
- tutorial-002 / -003 / -004 specs are authored in their own tickets (GAME-077 and the
  T3/T4 tickets) as their pedagogy is finalized.

## Goals / Acceptance Criteria

- [ ] `tutorial-001.spec.yaml` authored to the locked spec; `tutorial-001.json` regenerated.
- [ ] No-partisan-demographics pipeline path validated (loader/adapter/sim accept it).
- [ ] Tutorial flag/convention defined and documented for the overlay engine to key on.
- [x] T1 has no generator to retire (`gen-tutorial-001.main.kts` never existed); the
      `-002`/`-003` generators retire with their own migrations. No orphaned build refs.
- [ ] tutorial-001 plays: 37 hex-circle precincts, 2 districts, paint + submit works.
- [ ] Unit: pipeline produces 37 precincts for `hex_circle` r=3; criteria = district_count only.
- [ ] e2e: tutorial-001 is winnable by carving a second district (any chunk into D2).
- [ ] `hide_election_results` flag plumbed (spec → assembler → scenario → loader → UI);
      T1's election-results prediction panel is hidden.
- [ ] Validity panel is applicable-aware (balance only with a balance criterion; contiguity
      only when not "allowed"); hidden in T1; existing scenarios unchanged.
- [ ] e2e: T1 hides election-results + map-validity panels + view toolbar; painter forced
      open; legend absent.
- [ ] `hide_view_toolbar` flag plumbed; legend removed game-wide (paint toolbar = legend).
- [ ] Population balance made opt-in in `isMapSubmittable` (`enforceBalance` param = has a
      balance criterion), so the result screen no longer fails T1 on an unenforced "within
      tolerance" check. Unchanged for scenarios with a balance criterion. e2e: a wildly
      imbalanced T1 split still passes.

## References

- Plan: `thoughts/shared/plans/2026-06-24-tutorial-redesign-pipeline-migration.md`.
- `game/scenarios/scenario-002.spec.yaml` — spec format reference.
- `game/web/src/pipeline/` — pipeline stages; `generate_scenario` CLI.
- `game/scenarios/gen-tutorial-*.main.kts` — generators to retire.
- Feeds: GAME-076 (overlay engine + T1 step script runs on this map).
