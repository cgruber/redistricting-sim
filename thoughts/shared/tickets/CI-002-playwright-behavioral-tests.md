---
id: CI-002
title: Playwright behavioral test harness
area: ci, testing, automation
status: resolved
created: 2026-04-25
---

## Summary

Add a Playwright-based behavioral test harness so agents and CI can verify
that the app renders correctly and the core interaction loop works — things
that TypeScript typechecks and unit tests cannot cover. This is the regression
baseline for every sprint demo.

Pure logic (loader validation, store transitions, simulation math) should be
tested with Vitest unit tests in the tickets that implement that logic.
Playwright covers everything that requires a browser: SVG rendering,
mouse interaction, view-mode toggles, and end-to-end scenario loading.

## Resolution

All AC met. Phase 1 (smoke test + framework) merged PR #38. Phase 2 (5 behavioral
tests) merged PR #50. Sprint 1 close condition satisfied.

Key implementation notes:
- `data-precinct-id` attribute added to hex paths in `SvgMapRenderer` enter selection
  for reliable per-precinct targeting.
- `locator.dispatchEvent("mousedown")` + `window.dispatchEvent(new MouseEvent("mouseup"))`
  used instead of `page.mouse` — more reliable for SVG with large/negative viewBox.
- All precincts start as District 1 (loader auto-fills null initial_district_id);
  tests switch to District 2 before painting so strokes are real changes.

## Current State (archived)

No behavioral tests exist. CI runs `bazel test //web/...` which only exercises
TypeScript typechecks. Smoke-testing the app is manual.

## Goals / Acceptance Criteria

**Phase 1 — Framework (Sprint 1, parallel with GAME-002–005):**
- [x] Playwright added to `game/web/` workspace (npm dev-dependency)
- [x] Bazel target `//web:e2e_test` (or equivalent) that:
  - Uses esbuild static bundle served via python3 http.server (no Vite dev server; esbuild is CI-friendly)
  - Runs the Playwright test suite
  - Tears down cleanly; passes in CI
- [x] Smoke test: app loads; `#map-svg` is present and contains at least one
  `path.hex` element; no console errors on load
- [x] `bazel test //web/...` includes the e2e target and passes

**Phase 2 — Sprint 1 demo behavioral tests (immediately after GAME-005 merges):**
- [x] Scenario load: `tutorial-001.json` loaded; precinct count in SVG matches
  scenario precinct count; no validation errors in console
- [x] Paint interaction: mousedown+mousemove across precincts assigns them to
  the active district (verified via DOM attribute or store state)
- [x] Undo: after a paint stroke, undo restores previous assignments
- [x] View toggle: clicking the view-toggle button changes hex fill colors
  (districts → lean mode produces RdBu interpolated fills)
- [x] District boundary rendering: adjacent precincts in different districts
  have a boundary line between them

**Ongoing convention (applies from this ticket forward):**
- Each sprint's demo AC maps to at least one Playwright test
- Regression: existing tests must pass before a sprint demo PR can merge

## Notes

- Playwright is preferred over Puppeteer for this stack: better ergonomics for
  SVG interaction, first-class Vite integration, and good Bazel integration
  via `sh_test` wrapping or `rules_playwright` if available for bzlmod.
- Vitest + jsdom covers unit logic; Playwright covers browser behavior.
  Don't use Playwright for pure logic tests — they're slow and fragile there.
- Agent-driven testing: agents running sprint work should be able to execute
  `bazel test //web:e2e_test` and get a pass/fail signal without manual steps.

## Sprint Slot

Phase 1 targets Sprint 1 (parallel, no dependency on GAME-002–005).
Phase 2 targets Sprint 1 close (after GAME-005 merges).
Both phases should be complete before Sprint 2 begins.

## References

- Sprint roadmap: `thoughts/shared/plans/2026-04-25-sprint-roadmap.compressed.md`
- Bazel workspace: `game/BUILD.bazel`, `game/web/BUILD.bazel`
- Vite config: `game/web/vite.config.ts`
