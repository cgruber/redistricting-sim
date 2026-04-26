---
id: BUILD-004
title: "Playwright sh_test macro: proper Bazel rule for virtual store path resolution"
area: build, testing
status: open
created: 2026-04-26
---

## Summary

The current `//web:e2e_test` sh_test resolves the playwright binary from the
physical `node_modules/.bin/playwright` (installed by `setup.sh`). This works
because the playwright runner and spec file imports must share the same
`@playwright/test` module instance. However, the shell script that locates
node_modules uses an ad-hoc `readlink` chain rather than a proper Bazel
abstraction.

The long-term fix is a `.bzl` macro (e.g. `playwright_sh_test`) that:
- Wraps `sh_test` with playwright as a properly declared `data` dependency
- Generates a wrapper script with the playwright CLI path baked in by Bazel
  (so the script never has to discover paths at runtime)
- Handles the module-identity constraint (runner and spec files must share one
  `@playwright/test` instance) within Bazel's declared dependency model

This would eliminate the current `readlink`-based WORKSPACE_DIR discovery and
the physical `node_modules` runtime dependency.

## Current State

`//web:e2e_test` in `web/BUILD.bazel`:
- Declares `//:node_modules/@playwright/test` as a data dep (correct for cache key)
- `e2e_test.sh` uses `readlink` on the runfiles symlink for `playwright.config.ts`
  to locate the physical workspace root and `node_modules/.bin/playwright`
- This avoids multi-hop symlink-following from BASH_SOURCE but still relies on
  physical `node_modules` being installed by `setup.sh` outside Bazel

The module-identity issue: running playwright from the rules_js virtual store
causes "two different versions of @playwright/test" errors because the spec
files resolve `@playwright/test` via directory walking to physical node_modules
(which takes precedence over NODE_PATH).

## Goals / Acceptance Criteria

- [ ] Create `tools/playwright.bzl` (or equivalent) with a `playwright_sh_test`
      macro that wraps `sh_test` and handles playwright path resolution within
      Bazel
- [ ] The macro generates a wrapper script with baked-in paths (no runtime glob
      or readlink discovery)
- [ ] Both the playwright runner and the spec file imports resolve to the same
      `@playwright/test` instance (no "two different versions" error)
- [ ] `//web:e2e_test` migrated to use the macro; all 38 existing tests pass
- [ ] `local = True` and `no-sandbox` preserved (system Chrome requirement)

## Test Coverage

- [ ] All 38 existing e2e tests continue to pass under `bazel test //web:e2e_test`

## References

- `web/BUILD.bazel` — current `e2e_test` sh_test target
- `web/e2e_test.sh` — current wrapper script with readlink-based workspace discovery
- `game/MODULE.bazel` — `aspect_rules_js` 2.9.2 via bzlmod
- Upstream issue: rules_playwright blocked on playwright ≥ 1.57
  (mrmeku/rules_playwright#44)
- Related: if/when `rules_playwright` in BCR unblocks, evaluate replacing this
  macro with the upstream rule
