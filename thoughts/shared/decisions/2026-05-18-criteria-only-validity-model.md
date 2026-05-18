---
date: 2026-05-18
status: accepted
---

# ADR: Criteria-Only Validity Model

## Status

Accepted. Implementation tracked in GAME-074.

## Context

The codebase currently has two overlapping systems for checking whether a player's
map meets requirements:

**System 1 — structural validity** (`validity.ts`, `isMapSubmittable`): computed from
`rules.*` fields in the scenario JSON. Checks whether all precincts are assigned,
whether population is within `rules.population_tolerance`, and whether districts are
contiguous. Used to determine `mapIsValid`, which gates `overallPass` and triggers
`buildValidityRows` — synthetic diagnostic rows prepended to the result screen on
invalid maps.

**System 2 — scenario criteria** (`evaluate.ts`, `success_criteria`): explicit
player-facing goals in the scenario JSON. Includes `population_balance`,
`district_count`, `compactness`, `seat_count`, etc. Evaluated after the player
submits, shown as the main result screen criteria list.

These systems overlap. Tutorial-001 has both `rules.population_tolerance: 0.05` AND
a `population_balance` required criterion — the same constraint expressed twice,
producing duplicate rows on the result screen when the map fails (one validity row,
one criterion row), and a single row when it passes. A workaround was added to
suppress validity rows that duplicate a scenario criterion, but this is the wrong
fix: it papers over a design flaw.

The deeper issue: the validity system encodes assumptions about what every redistricting
scenario must require — contiguous districts, population equivalence. These are not
universal rules. They reflect current US redistricting law. A scenario set in an
alternative polity, a historical period, or a speculative legal environment might
legitimately omit them. Making them engine-level invariants disempowers scenario
authors and contradicts the game's educational purpose (which is to surface the
contingency of these rules, not naturalize them).

## Decision

**Collapse to a single model: criteria only.**

### The one true engine invariant

"All precincts must be assigned to a district" is the only constraint enforced at the
engine level, not via a scenario criterion. It is a mechanical game requirement: the
election simulation produces undefined results if any precinct is unassigned. It is
not a political or legal rule — it applies to any electoral system. It will remain as
a pre-submit check with a clear UI message, but will NOT appear in the criteria list.

Everything else — population balance, contiguity, seat counts, compactness — is a
scenario criterion. Authors include it or not.

### Schema changes

`rules.population_tolerance` is removed. The `population_balance` criterion gains a
`tolerance` field:

```json
{
  "type": "population_balance",
  "tolerance": 0.05
}
```

`rules.contiguity` is removed. Contiguity becomes an opt-in criterion:

```json
{
  "type": "contiguity"
}
```

The `rules` block is deprecated. Any remaining fields should migrate to either
criteria or scenario-level metadata. The block may be removed entirely once all
scenarios are migrated.

### Simplifications

- `isMapSubmittable` is removed. `mapIsValid` gate on `overallPass` is removed.
  `overallPass` = all required criteria pass AND all precincts assigned.
- `buildValidityRows` is removed. The result screen shows only scenario criteria
  (plus the engine's "all assigned" check if violated).
- The suppression logic added in May 2026 is removed.
- `computeValidityStats` is simplified: only the all-assigned and district-in-use
  checks remain (needed for the `district_count` criterion and the engine invariant).
  Population and contiguity checks move into their respective criterion evaluators.

### Scenario authoring defaults

New scenarios (and the scenario editor, when built) should default to including
`contiguity` and `population_balance` criteria as required, since these reflect
the most common real-world requirements. Removing them is allowed, and the editor
should show a warning ("this criterion is required by most real-world redistricting
laws — remove it intentionally if your scenario models a different legal context").

### Migration

All existing scenario JSON files are updated:
- Remove `rules.population_tolerance`; move tolerance value to the `population_balance`
  criterion's `tolerance` field.
- Remove `rules.contiguity`; add a `contiguity` criterion if the scenario previously
  required it (all current scenarios do).
- Remove `rules` block if it becomes empty.
- Add `character_demographics` for any scenario missing it (forward-compat).

## Consequences

- **Scenario JSON**: `rules` block deprecated; `population_balance` criterion gains
  `tolerance` field; `contiguity` criterion added.
- **`scenario.ts`**: update types for criterion union; deprecate/remove `rules`.
- **`loader.ts`**: validate `tolerance` on `population_balance`; remove contiguity
  and population rules parsing; add loader warning if `rules` block is non-empty.
- **`validity.ts`**: retain only all-assigned and district-in-use checks.
- **`evaluate.ts`**: `population_balance` reads tolerance from criterion spec;
  add `contiguity` criterion type.
- **`main.ts`**: remove `isMapSubmittable`, `mapIsValid`, `buildValidityRows`.
  Update `overallPass` logic.
- **All scenario JSON files**: migration required.
- **e2e tests**: update any tests that relied on validity rows or `mapIsValid`
  gating behaviour.
- **Educational upside**: all constraints become visible to players as explicit
  criteria, reinforcing the game's message that these rules are choices, not laws
  of nature.
