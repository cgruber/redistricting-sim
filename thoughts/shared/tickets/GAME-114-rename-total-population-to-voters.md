---
id: GAME-114
title: Rename total_population → a voter-oriented term (deferred)
area: game, simulation, code-quality
status: open
created: 2026-06-30
---

## Summary

Deferred / low-priority follow-on to GAME-113. The model's `total_population` field is not raw
census population — it is the turned-out voting population (see GAME-113's turnout framing).
Renaming it to a voter-oriented term (`voters` / `electorate` / `voting_population`) makes that
model self-documenting at the field level, so the "these are voters, not census pop" intent
can't be forgotten. Mechanical rename, no behavior change.

## Current State

- `total_population` appears across the scenario JSON schema, `model/scenario.ts` /
  `runtime-types.ts` / `loader.ts`, `adapter.ts` (→ `Precinct.population`), `validity.ts`
  (population balance), the pipeline population stage, and every shipped `game/scenarios/*.json`.
- GAME-113 documents the "population = voters" model in prose; this ticket bakes it into the
  field name.

## Goals / Acceptance Criteria

- [ ] Decide the new name (`voters` is shortest; `voting_population` is most explicit).
- [ ] Rename consistently across the schema, loader, runtime types, adapter, validity, pipeline,
  and all scenario JSON (the pipeline regenerates scenarios, so update the generator + regenerate
  rather than hand-editing where possible).
- [ ] Purely mechanical — no change to any computed value or metric; full test suite green,
  scenarios still load and validate.
- [ ] Keep a one-line note that "voters = turned-out voting population" at the definition site.

## Test Coverage

- [ ] Existing loader/adapter/validity/pipeline tests pass unchanged after the rename (they are
  the regression guard); update fixtures that reference the old field name.

## References

- Audit: `thoughts/shared/research/2026-06-30-gerrymandering-metrics-audit.compressed.md` (§FINDINGS 7)
- Related: GAME-113 (turnout framing — do first), GAME-112, GAME-084 (pipeline generates scenarios)
