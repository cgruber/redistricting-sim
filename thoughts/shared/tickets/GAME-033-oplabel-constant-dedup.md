---
id: GAME-033
title: Deduplicate opLabel constant in evaluate.ts
area: game, code-quality
status: resolved
created: 2026-04-29
---

## Summary

The `Record<CompareOp, string>` map `{ lt: "<", lte: "≤", eq: "=", gte: "≥", gt: ">" }` is
declared four separate times inside `simulation/evaluate.ts` (lines ~199, 208, 259, 288) with
slightly differing local names (`opLabel`, `opLabel`, `opLabel2`, `opLabel3`). Extract it once
as a module-level constant.

## Current State

Four inline identical literals in `evaluateCriterion` and related functions. Any future operator
addition requires four edits with no compiler enforcement.

## Goals / Acceptance Criteria

- [ ] Single module-level `const OP_LABEL: Record<CompareOp, string>` in `evaluate.ts`
- [ ] All four inline usages replaced with the shared constant
- [ ] `bazel test //game/web/src/simulation:evaluate_test` still passes (no behavior change)

## Test Coverage

- Existing `evaluate_test.ts` suite covers all code paths; re-run confirms no regression.
- No new test cases needed — this is a pure constant extraction.

## References

- `game/web/src/simulation/evaluate.ts` lines ~199, 208, 259, 288
