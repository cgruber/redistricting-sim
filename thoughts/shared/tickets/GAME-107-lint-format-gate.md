---
id: GAME-107
title: Add a linter + formatter CI gate to game/web
area: game, build, ci, code-quality
status: open
created: 2026-06-27
---

## Summary

There is **no ESLint/Biome/Prettier and no lint/format gate anywhere** in `game/` — the strict
`tsconfig` is the only static check. This is the systemic backstop for an entire class of the
review's findings (non-null assertions on optional fields, duplicated literals, exhaustiveness
drift) and it also makes the deploy reformat hazard (GAME-108) impossible. From the 2026-06-27
quality review (top-10 #10, meta-theme).

## Current State

- `game/web/tsconfig.json` is strict (`strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noImplicitReturns`) but the compiler can't catch
  style/idiom/literal-drift issues. The spike (`spike/001-game-poc`) has a `biome.json`; the
  production game has nothing.
- Findings a linter would have surfaced or prevented: non-null assertions on all-optional
  `CriterionSpec` (`assembler.ts:12-59`); the `data:`/inline-`onclick` patterns (GAME-103);
  literal drift across files (GAME-104). A formatter would make `release.main.kts`'s
  exact-string index.html patches stable (GAME-108).

## Goals / Acceptance Criteria

- [ ] Choose ESLint (typescript-eslint) or Biome — prefer **Biome** for speed + already-in-repo familiarity (the spike uses it); document the decision.
- [ ] Add config covering `game/web/**` with a sensible ruleset (recommended + `no-non-null-assertion`, `no-explicit-any`, exhaustiveness/`switch` rules where available).
- [ ] Add a formatter (Biome formatter or Prettier) with config; format the existing tree in one mechanical commit (kept separate from rule-fix commits for reviewability).
- [ ] Wire a Bazel test target (or CI step) that fails on lint/format violations, so it gates merge alongside the existing typecheck/test targets.
- [ ] Document the local invocation in the repo (how to run lint/format) and in AGENTS if a new standing command is introduced.

## Test Coverage

- [ ] The lint/format target is part of `bazel test //game/...` (or the CI bar) and is green after the initial format/fix pass.
- [ ] A deliberately mis-formatted / lint-violating file fails the gate (manual verification).

## References

- Review: `thoughts/shared/research/2026-06-27-codebase-quality-review.md` (Theme 7 meta; top-10 #10)
- `game/web/tsconfig.json`, `spike/001-game-poc/biome.json` (reference config), `game/web/src/pipeline/assembler.ts`
- Related: GAME-108 (deploy reformat hazard), GAME-103/104 (subsumed classes)
