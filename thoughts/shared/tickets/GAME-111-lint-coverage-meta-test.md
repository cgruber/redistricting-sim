---
id: GAME-111
title: Meta-test that every game/web/src subpackage is wired into the lint gate
area: game, ci, code-quality
status: open
created: 2026-06-28
---

## Summary

The GAME-107 Biome lint gate (`//game/web:lint_test`) lints each `game/web/src` subpackage via a
per-package `:lint_sources` filegroup in the test's `data` (Bazel `glob` doesn't cross package
boundaries). A **future** new subpackage (its own `BUILD.bazel`) that forgets to add a
`:lint_sources` filegroup — or to wire it into `lint_test`'s `data` — would be lint-clean on a cold
run but never re-checked on edit until an unrelated cache bust. That's the same gate-erosion class
GAME-109's `unwired_tests_test` guards for `*_test.ts` files. Raised in the PR #308 review.

## Current State

- `lint_test` (`game/web/BUILD.bazel`) `data` lists the root `src/**/*.ts` glob + `e2e/**/*.ts` +
  one `:lint_sources` filegroup per `src/` subpackage (model, simulation, store, audio, pipeline).
  All 6 current packages are correctly wired.
- Nothing asserts that EVERY subpackage with `*.ts` is represented. A new `src/<pkg>/BUILD.bazel`
  with sources is invisible to the gate's cache-invalidation until someone notices.

## Goals / Acceptance Criteria

- [ ] Add a meta-test (sh_test, mirroring `//game/web:unwired_tests_test`) that fails when a
      `game/web/src` subpackage contains `*.ts` but has no `:lint_sources` filegroup wired into
      `lint_test`'s `data` (or, equivalently, asserts every package's `.ts` files are reachable by
      the lint gate's data deps).
- [ ] Prove it: temporarily add a dummy `src/<newpkg>/BUILD.bazel` + a `.ts` file not wired to
      `:lint_sources`, confirm the meta-test FAILS, then remove the dummy.
- [ ] Keep it a backstop, not a macro — don't auto-generate the filegroups.

## Test Coverage

This ticket **is** a test. The AC above is the proof.

## References

- PR #308 review: https://github.com/cgruber/redistricting-sim/pull/308#discussion_r3489642354
- `game/web/BUILD.bazel` (`lint_test`, `:lint_sources` filegroups), `game/web/unwired_tests_test.sh` (the GAME-109 sibling pattern to mirror)
- Related: GAME-107 (the lint gate), GAME-109 (the `*_test.ts` unwired backstop)
