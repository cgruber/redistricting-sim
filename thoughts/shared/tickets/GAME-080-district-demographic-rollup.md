---
id: GAME-080
title: District demographic rollup — live aggregate stats per district while painting
area: game, UX
status: open
created: 2026-05-18
---

## Summary

While painting districts, players have no way to see aggregate demographic data for the
district as a whole — only per-precinct data on hover. This makes majority_minority scenarios
(Valle Verde, and the planned VRA scenarios) nearly unplayable: the player cannot know
whether District 3 has achieved 50%+ Latino representation without submitting and checking
the result screen. Add live per-district demographic rollup derived automatically from the
active scenario criteria.

## Design principles

**Scenario-aware, derived not configured**: do not add UI fields to the scenario spec.
Instead, scan the active criteria for any that reference a demographic dimension and
automatically surface that dimension in the district display. If a `majority_minority`
criterion exists with `group: "latino"`, the UI shows % Latino per district. No extra
scenario JSON needed.

**Categorical mapping (criteria → dimensions):**
- `majority_minority` criterion → show the criterion's target group % per district
- `efficiency_gap` or `mean_median` → could show lean/party split % (already partially shown)
- No criterion references a dimension → no demographic stat shown (keeps simple scenarios clean)

**Phase 1 (this ticket):** compact one-line stat under each district button.
**Phase 2 (future ticket):** expandable district detail panel with full demographic breakdown.

## Implementation approach

At map load, inspect `scenario.criteria` for criteria that reference demographic groups.
For `majority_minority`:
- Find the `group` field (e.g. `"latino"`)
- At paint time, iterate all precincts assigned to each district, compute the weighted
  average of that group's percentage (weighted by precinct population)
- Display result as "48% Latino" under the District 3 button

The computation runs on every paint action (already happens for population balance).
The group lookup uses the same `group_percentages` data already in precinct objects.

## Goals / Acceptance Criteria

### Phase 1 — compact stat under district button

- [ ] On scenario load: scan criteria for demographic dimension references
- [ ] If `majority_minority` criterion found: identify target group key
- [ ] For each district: compute live weighted-average % of that group across assigned precincts
- [ ] Display as compact line under district button: e.g. "48% Latino" or "51% Black VAP"
- [ ] Updates live on every paint / undo / redo action
- [ ] No display shown for scenarios with no demographic criterion (no regression for
      simple scenarios)
- [ ] Label uses human-readable group name from `scenario.group_schema` if available,
      falls back to raw key

### Display spec

- One line below the district button's population balance indicator
- Format: `{N}% {GroupName}` — e.g. "48% Latino", "51% Black"
- Color: neutral (no red/green — the player decides if it's sufficient)
- If the criterion has a threshold, optionally show a faint target indicator
  (e.g. subtle underline changes when threshold is met) — nice-to-have, not required

## Test Coverage

- [ ] Unit: `computeDistrictDemographic(precincts, districtId, groupKey)` returns correct
      weighted average for a known assignment
- [ ] Unit: returns `null` (no display) when no criteria reference a demographic dimension
- [ ] e2e: Valle Verde — district buttons show Latino % while painting
- [ ] e2e: painting a precinct into a district updates the displayed % immediately
- [ ] e2e: tutorial-001 (no demographic criterion) — no demographic stat shown

## References

- `game/web/src/simulation/evaluate.ts` — `majority_minority` evaluator (has group lookup logic)
- `game/web/src/main.ts` — district button rendering, paint event handler
- `game/public/scenarios/scenario-006.json` (Valle Verde) — test scenario with majority_minority
- DESIGN-015 / GAME-081 — information density redesign (coordinates layout; Phase 2 panel trails this)
- DESIGN-013 / GAME-078 — VRA scenarios (primary motivation; Valle Verde is sufficient for testing)
