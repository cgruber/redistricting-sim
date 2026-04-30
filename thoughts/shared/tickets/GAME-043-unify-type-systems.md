---
id: GAME-043
title: Unify spike and scenario type systems (retire adapter.ts / types.ts)
area: game, code-quality
status: open
created: 2026-04-29
---

## Summary

The codebase maintains two parallel type systems: `model/scenario.ts` (canonical
scenario-format types, e.g. `Scenario`, `Precinct`) and `model/types.ts` (spike internal
types, e.g. the flat `Precinct` with `neighbors`, `partyVotes`). `adapter.ts` bridges them
at runtime. This split was an explicit Sprint 1 shortcut ("Sprint 3 will replace spike types
entirely") that was never cleaned up. It is the root cause of: the adapter translation layer,
the `partyIdToKey` indirection in `main.ts`, the dummy `demographics` field, the
`SPIKE_PARTY_KEYS` constant, and the vestigial `Demographics` interface.

## Current State

`adapter.ts` (112 lines) converts `scenario.ts` types → `types.ts` types at load time.
`election.ts`, `validity.ts`, and `evaluate.ts` all operate on `types.ts` types.
`mapRenderer.ts` also uses `types.ts` types. The scenario-format types in `scenario.ts`
are never used directly by simulation or rendering.

## Goals / Acceptance Criteria

- [ ] A single unified runtime precinct/district model (either extend `scenario.ts` types
  or define a new `model/runtime.ts`); no separate spike types
- [ ] `election.ts`, `validity.ts`, `evaluate.ts`, `mapRenderer.ts`, `gameStore.ts` all
  operate on the unified model
- [ ] `adapter.ts` eliminated (or reduced to a trivial load-time parse with no structural
  translation)
- [ ] `model/types.ts` eliminated or reduced to just the shared utility types that remain
- [ ] `partyIdToKey` indirection, `SPIKE_PARTY_KEYS`, dummy `demographics` field removed
- [ ] All unit tests and e2e tests pass

## Test Coverage

- [ ] All existing unit tests (`loader_test`, `evaluate_test`, `validity_test`, `progress_test`,
  `election_test`, `adapter_test`) must pass against the unified model with no behavior change
- [ ] All Playwright e2e tests pass
- Scope note: this refactor has no new testable behaviors of its own — it is a structural
  change; correctness is validated by the existing test suites continuing to pass

## Notes

This is the largest refactor in the backlog. It touches the simulation engine, renderer,
store, and main orchestrator simultaneously. It should be its own sprint with thorough design
upfront (what does the unified model look like?). Do not combine with other structural
changes. Recommend completing GAME-039 (hex geometry extraction) and GAME-041 (loader split)
first to reduce moving parts.

## References

- `game/web/src/model/adapter.ts`
- `game/web/src/model/types.ts`
- `game/web/src/model/scenario.ts`
- `game/web/src/simulation/election.ts`, `evaluate.ts`, `validity.ts`
- `game/web/src/render/mapRenderer.ts`
- `game/web/src/store/gameStore.ts`
- `game/web/src/main.ts` (partyIdToKey)
