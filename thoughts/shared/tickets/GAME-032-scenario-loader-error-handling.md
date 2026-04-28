---
id: GAME-032
title: Improve scenario loader validation and error handling
area: game, reliability
status: open
created: 2026-04-27
---

## Summary

The scenario loader (`web/src/model/loader.ts`) fails silently on malformed JSON,
preventing the game from loading with no user-visible error. When a criterion is
missing a required field (e.g. `mean_median` without `party`), the loader throws
deep in `requireString()` and the intro screen never appears — the player sees a
blank page.

Discovered during GAME-028 backport: scenario-004's `mean_median` criterion was
missing the `party` field. The only diagnostic was a console error buried in the
browser devtools.

## Current State

- `loadScenario()` throws on validation failure; caller catches and logs to console
- No user-visible error message, no recovery path
- Validation is strict (good) but error reporting is poor
- Missing fields produce generic "expected string, got undefined" messages without
  suggesting which field is wrong or what the valid options are

## Goals / Acceptance Criteria

- [ ] User-visible error screen when a scenario fails to load (not blank page)
- [ ] Error message includes: scenario ID, which validation rule failed, and what
      was expected (e.g. "mean_median criterion requires 'party' field")
- [ ] Consider looser parsing with post-load validation: parse what you can, then
      validate semantics, producing a list of all errors (not just the first)
- [ ] e2e test: load a scenario with a known validation error, assert error screen shown

## References

- `web/src/model/loader.ts` — `loadScenario()`, `parseCriterion()`
- GAME-028 — discovered during hex backport
