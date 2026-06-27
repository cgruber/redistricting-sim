---
id: GAME-106
title: WIP save/restore + undo correctness — preserve nulls, validate stale state, scope undo
area: game, state, correctness
status: open
created: 2026-06-27
---

## Summary

The Continue/restore path silently bypasses the all-precincts-assigned win-gate and can
restore a structurally-wrong board; undo also carries transient UI state. From the 2026-06-27
quality review (Theme 7 / State) — includes one `high`.

## Current State

- **WIP save drops null precincts (HIGH, hand-verified).** `flushWipSave` persists only
  `v !== null` entries (`main.ts:542-543`). On restore, `restoredMap` is built solely from the
  persisted record (`main.ts:529-531`) and `restoreAssignments` does `new Map(assignments)`
  with no re-seed (`gameStore.ts:111-117`). `computeValidityStats` counts unassigned via
  `v === null` (`validity.ts:43-46`) — a **missing key is never counted**, so `unassignedCount`
  reads 0 after restore and the "All precincts must be assigned" failure row is dropped. The
  adapter seeds an entry for every precinct (value may be null) precisely so validity/contiguity
  can treat present-but-null as unassigned; the round-trip violates that invariant.
- **Stale WIP restored unvalidated.** `loadWip` (`progress.ts:42-61`) checks only types, not
  bounds, and WIP is keyed only by `scenarioId`. Scenarios are regenerated under the same id
  (documented project reality), so a stale WIP restores into a changed shape: out-of-range
  precinct/district indices, bogus `activeDistrict` (`main.ts:526-536`).
- **Undo reverts `activeDistrict`.** `temporal()` has no `partialize`, so each snapshot is the
  full state; the equality gate compares only `assignments`, so `setActiveDistrict` rides along
  and undo flips the brush selection (`gameStore.ts:120-130,68-70`). History is unbounded and
  the header comment (`gameStore.ts:5`) wrongly says it tracks "assignment diffs."

## Goals / Acceptance Criteria

- [ ] Round-trip preserves null entries: either write null-valued precincts in `flushWipSave`, or on restore seed from the scenario's full initial key set and overlay saved assignments (every id present, default null). `unassignedCount` is correct after restore.
- [ ] After restore, validate/clamp against the loaded scenario: drop assignment entries whose precinct index ≥ `precincts.length` or whose district ∉ `1..districtCount`; clamp `activeDistrict` into range (fall back to 1). Optionally store a scenario fingerprint (precinct + district count) in `WipState` and discard on mismatch.
- [ ] Add `partialize: (s) => ({ assignments: s.assignments })` to the zundo options and a `limit`; correct the header comment.

## Test Coverage

- [ ] Extract the WIP serialize/deserialize into a pure testable function; round-trip test: save a map with a null precinct, assert `unassignedCount > 0` after restore.
- [ ] Restore test: stale WIP with out-of-range precinct/district is dropped/clamped, not applied verbatim.
- [ ] Undo test interleaves `setActiveDistrict` and paint, then asserts `activeDistrict` is the live value (not the snapshot value) after undo.

## References

- Review: `thoughts/shared/research/2026-06-27-codebase-quality-review.md` (Theme 7; State findings)
- `game/web/src/main.ts`, `game/web/src/store/gameStore.ts`, `game/web/src/model/progress.ts`, `game/web/src/simulation/validity.ts`
