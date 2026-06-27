---
id: GAME-108
title: Deploy robustness — fail loud on patch mismatch, per-env idempotency, asset misfiling
area: game, build, deployment, tooling
status: open
created: 2026-06-27
---

## Summary

`release.main.kts` ships broken output silently in several cases, and the deployable genrule
will misfile future JSON assets. From the 2026-06-27 quality review (Theme 7 / Tooling).

## Current State

- **Patches fail silently (MED).** Deploy patches `index.html` by exact-string replacement
  (`bundle.js` → versioned; empty `app-version`/`app-environment` meta → filled,
  `release.main.kts:383-413`). On a failed match it prints a warning and **continues** —
  commit, push, exit 0. A failed bundle patch ships with no `?v=` cache-bust (stale bundle);
  a failed meta patch ships empty version/env. A routine `index.html` reformat (no formatter
  today, see GAME-107) silently breaks all three while the deploy reports success.
- **Idempotency guard only reads the tip commit (LOW).** The already-deployed guard greps the
  latest `web_deploy` commit description for `$env: <version>` (`328-335`), but each deploy
  commits only its own env line (`427`). Deploy staging→beta→re-run staging finds no
  `staging:` match on the tip and re-deploys. (Worst case: a redundant but correct re-deploy.)
- **Genrule will misfile future `assets/*.json` (LOW).** The deployable genrule loops all
  `$(SRCS)` and a basename `case` copies any `*.json` into `STAGING/scenarios/` and any
  `*.wasm` into root (`web/BUILD.bazel:172-185`), before the dedicated `cp -r` of the assets
  tree. A future `assets/*.json` (sprite atlas, config) lands in `scenarios/`, polluting the
  manifest space the loader enumerates. (`*.css` is NOT affected — `styles.css` is an exact
  basename match, not a wildcard.)

## Goals / Acceptance Criteria

- [ ] Failed `index.html` patches become a **hard error** (`err(...)` → `exitProcess(1)`) before committing; add a post-write assertion that the expected version string is present in the written HTML.
- [ ] Track per-env deployed versions durably (e.g. read each env's `deployment-metadata.json`, or a committed `deployment-state.json`) instead of scraping only the tip commit.
- [ ] Guard the genrule basename `case` so asset-tree files are skipped: `case "$f" in */assets/*) ;; *) <existing case> ;; esac` (the dedicated `cp -r` already handles them).

## Test Coverage

- [ ] A small test runs the index.html patch logic against the real `index.html` and asserts the patches apply — a reformat that breaks the literals fails CI rather than production.
- [ ] (If feasible) a unit/integration check of the per-env idempotency state.

## References

- Review: `thoughts/shared/research/2026-06-27-codebase-quality-review.md` (Theme 7 / Tooling)
- `game/release.main.kts`, `game/web/BUILD.bazel`
- Related: GAME-107 (formatter prevents the reformat trigger), BUILD-009 (content-hashed bundles — supersedes the `?v=` kludge)
