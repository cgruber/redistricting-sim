# Tickets

Canonical summary of all open and resolved work items. Individual ticket files in this directory contain full detail. This file is the index — do not duplicate ticket content here, and do not maintain ticket inventories elsewhere (AGENTS.md, research docs, etc. should reference this file instead).

## How This Works with GitHub Issues

Ticket files are the source of truth. GitHub Issues are created when starting work on a ticket (not before, not at PR-open time):

```bash
kotlin /opt/geekinasuit/agents/tools/gh-ticket.main.kts -- create <ticket-path>
```

Reference issues from PRs with `see #N` — never `fixes #N` or `closes #N`. Issues are always closed manually once the full Definition of Done is met.

A GitHub Action (see `CI-001-github-action-ticket-close-sync.md`) will act as a safety net for cases where the PR didn't include the ticket update. That action is permitted to commit directly to `main` for bookkeeping-only changes — a narrow, explicit exception that applies to the GitHub Actions bot only. Agents must go through a branch and PR even for ticket bookkeeping.

---

## What Makes a Good Ticket

A ticket is done when both the **feature** and its **tests** are merged. Test coverage is not optional — it is part of the Definition of Done on every ticket.

### Required sections

| Section | What goes here |
|---|---|
| **Summary** | One paragraph: what, why, scope boundary |
| **Current State** | What exists today; what gap this ticket closes |
| **Goals / Acceptance Criteria** | Checkboxes for every behavioral requirement |
| **Test Coverage** | Explicit test AC items (see below) |
| **References** | File paths, related tickets, prior research |

### Test Coverage AC — what to include

Every ticket that touches logic or UI must include a **Test Coverage** section with acceptance criteria items. These are DoD requirements, not suggestions.

**Pure functions / domain logic** (no DOM, no D3):
- Unit test each distinct behavior: happy path, edge cases, error cases
- Pattern: hand-rolled TAP runner in `*_test.ts`, run via `js_test` in BUILD.bazel
- Examples: population deviation calculation, BFS contiguity, loader validation

**UI interactions / behavioral flows**:
- One Playwright e2e test per named interaction (button click, hover, paint, etc.)
- Assert visible DOM outcomes: text changes, element visibility, attribute values
- Pattern: `e2e/sprint<N>.spec.ts` or `e2e/<feature>.spec.ts`
- Examples: button label changes, sidebar content updates, reset flow

**What to skip** (explicitly note in ticket if skipping):
- Tests that require browser-internal APIs unavailable in Playwright headless (e.g. WebGL readback)
- Tests for rendering pixel-accuracy (use visual regression tools separately)
- d3 internals or scroll/touch gesture simulation (note as out-of-scope, not forgotten)

### Workflow note

Follow the TDD intent from `thoughts/shared/research/2026-04-21-multi-agent-tdd-workflow.md`:
tests should be written alongside or before implementation, not as a backfill. When creating a ticket, write the test AC before starting the implementation. When opening a PR, tests must be included — a PR with implementation but no tests is incomplete.

---

## Ticket ID Categories

| Prefix | Meaning |
|---|---|
| `KT-NNN` | Kotlin implementation work (dormant — Kotlin removed) |
| `DB-NNN` | Database schema, migrations, and cross-language DB tooling |
| `BUILD-NNN` | Build system and tooling (Bazel, bzlmod, rules) |
| `CI-NNN` | CI, automation, and testing infrastructure |
| `OPT-NNN` | Performance optimization |
| `AGENT-NNN` | Agentic workflow and agent tooling changes |
| `SPIKE-NNN` | Time-boxed proof-of-concept investigations |
| `LEGAL-NNN` | Legal, content liability, and compliance research |
| `DIST-NNN` | Distribution, deployment, and platform research |
| `DESIGN-NNN` | Game design, UX, and ergonomics research |
| `GAME-NNN` | Game implementation work (rendering, simulation, content, game loop) |

---

## Open

| File | Area | Summary |
|---|---|---|
| `BUILD-003-ts-rules-spawn-strategy-research.md` | build, typescript | Research optimal spawn_strategy config for aspect_rules_ts on macOS (darwin-sandbox + multi-target packages) |
| `BUILD-004-playwright-bzl-macro.md` | build, testing | Playwright sh_test macro: proper Bazel rule for virtual store path resolution, replacing ad-hoc readlink discovery |
| `CI-001-github-action-ticket-close-sync.md` | automation, github, tickets | GitHub Action safety net: sync ticket state when issue is closed without a PR ticket update |
| `DIST-001-steam-deployment-research.md` | distribution, platform | Research Steam free/educational program, achievements API, web-vs-Steam tradeoffs |
| `DESIGN-001-achievement-star-system.md` | design, UX | Game ergonomics research for star/achievement ranking system (required vs. optional criteria) |
| `AGENT-003-infra-pr-review-bot-comment-handling.md` | agentic workflow, infra | Propose bot comment handling (Copilot, CodeQL) to infra pr-review-cycle workflow |
| `DESIGN-004-legend-layout.md` | design, UX | Move legend to horizontal strip above map; free sidebar space for data panels |
| `DESIGN-005-population-dot-density-overlay.md` | design, rendering | Population dot density overlay: dot count per precinct proportional to population; hue-aware dot color; colorblind-safe palette |
| `DESIGN-006-zoom-adaptive-dot-density.md` | design, rendering | Zoom-adaptive dot density scaling + person glyph threshold (refinement on DESIGN-005, possibly post-v1) |
| `DESIGN-007-dimensional-dot-map-demographic-overlay.md` | design, rendering | Dimensional dot map: demographic dimension switching (Option B adaptive encoding) + sorted placement toggle |
| `GAME-008-accessibility.md` | game, accessibility | Full a11y pass: color-blind-safe palettes, ARIA labels, keyboard nav, screen reader support |
| `GAME-030-main-menu-and-campaigns.md` | game, UX, architecture | Main menu, campaign model, campaign select, layered navigation; replaces scenario-select-as-home |
| `GAME-031-gameplay-critique-followup.md` | game, content, balance | Review and act on external gameplay critique research (scenario difficulty, eval balance, design) |
| `DESIGN-008-geographic-features.md` | design, rendering | Geographic features (lakes=aqua+wave, mountains=grey+hatch) as decorative non-precinct tiles; blocks contiguity |
| `BUILD-007-shared-test-runner.md` | build, testing | Extract shared TAP test runner module; eliminate boilerplate copied across 4+ test files |
| `GAME-033-oplabel-constant-dedup.md` | game, code-quality | Deduplicate opLabel constant in evaluate.ts (4 inline copies → 1 module-level const) |
| `GAME-034-error-panel-dedup.md` | game, code-quality | Deduplicate inline error panel HTML in main.ts (2 identical blocks → showLoadError function) |
| `GAME-038-extract-panel-renderers.md` | game, code-quality | Extract DOM panel renderers out of mapRenderer.ts into render/panels.ts |
| `GAME-039-extract-hex-geometry.md` | game, code-quality | Extract hex geometry utilities (hexToPixel, hexCorners, mapBounds) from generator.ts into hex-geometry.ts |
| `GAME-041-split-loader.md` | game, code-quality | Split loader.ts: extract runtime-types.ts primitives; name validateScenario() internally |
| `GAME-042-break-up-main.md` | game, code-quality | Break up main.ts god module into testable units (scenarioSelect, resultScreen, introFlow) |
| `GAME-043-unify-type-systems.md` | game, code-quality | Unify spike and scenario type systems; retire adapter.ts and types.ts spike layer |

---

## Resolved

| Summary | Resolution |
|---|---|
| LEGAL-001: content risk assessment | Low risk for v1; all pre-authored content, fictional entities, educational framing; disclaimers added to about page + Valle Verde; authoring tool deferred to post-v1 review |
| GAME-006: scenario compression | HTTP gzip sufficient for v1; no code changes needed; .scenarioz deferred to community scenarios |
| GAME-040: mapRenderer magic numbers | 22 named static readonly constants extracted (opacities, zoom step, lightness coefficients, fallback dims, dash patterns); no behavior change; typecheck passes |
| GAME-037: adapter unit tests | 12 tests for scenarioToSpike: precinct count, party weights, multi-group pop-weighting, neighbor wiring, district assignments, null assignments, districtCount |
| GAME-036: WIP persistence unit tests | 11 tests in separate progress_wip_test.ts with in-memory localStorage shim; round-trip, null cases, clear; all pass |
| GAME-035: election unit tests | 10 unit tests for runElection + simulateDistrict; exported simulateDistrict; js_test target added; all pass |
| GAME-032: loader error handling | User-visible error screen with scenario ID, error message, and back button; replaces blank page on validation/fetch failures |
| BUILD-006: extract inline styles | Inline `<style>` block extracted to styles.css; `'unsafe-inline'` remains in style-src for HTML element inline styles; serve + e2e updated |
| BUILD-005: CSP meta tag | CSP added; script-src/style-src include 'unsafe-inline' temporarily (inline scripts + styles); title updated to Past the Post |
| GAME-029: about page | All AC met; educational framing, non-partisan stance, resource links; merged PR #108 |
| GAME-028: hex-of-hexes backport | All AC met; scenarios 002-006 + tutorial-002 converted to hex-of-hexes; generators + JSON + readable e2e tests; merged PR #114 |
| GAME-027: hex-of-hexes map shape | All AC met; scenarios 007-009 hex-of-hexes R=6 (127 precincts); generators + JSON + 9 e2e tests; dynamic party adapter fix; merged PR #104 |
| GAME-020: wrap-up screen | All AC met; congratulations screen after completing final scenario; merged PR #107 |
| GAME-007: player progress persistence | All AC met; WIP save/resume + completion tracking; localStorage; merged (prior session) |
| DESIGN-003: districts view color encoding | Superseded — flat fills decided; population density → DESIGN-005 + DESIGN-006 |
| GAME-026: Valle Verde (VRA / majority-minority) | All AC met; 120-precinct Valle Verde scenario; group_schema + ethnicity dimension; 3 e2e tests; merged PR #102 |
| GAME-025: cracking the opposition | All AC met; 120-precinct Lakeview scenario; merged PR #97 |
| GAME-024: packing problem | All AC met; 120-precinct Riverport scenario; merged PR #97 |
| GAME-023: give the governor a win | All AC met; 96-precinct Clearwater scenario; merged PR #97 |
| GAME-022: missing evaluators | All AC met; efficiency_gap (wasted-vote), mean_median, majority_minority implemented; 22/22 unit tests; 39/39 e2e pass; merged PR #92 |
| GAME-021: multi-scenario manifest | All AC met; static manifest + URL routing (?s=id); select screen shows all entries; on-demand JSON fetch; 39/39 e2e tests pass; merged PR #90 |
| GAME-019: tutorial-002 winnability + e2e solve test | All AC met; county-aligned initial assignments (north→d1, central→d2, south→d3); painting p071–p075 (indices 70–74) solves the map; 39th e2e test verifies end-to-end pass; merged PR #83 |
| GAME-014: Scale tutorial scenario | All AC met; 196-precinct tutorial-002 scenario (3 counties, 4 districts); merged PR #79 |
| GAME-018: Progression | All AC met; scenario select screen + localStorage completion + AbortController intro; 18 unit tests + 5 e2e tests; merged PR #77 |
| GAME-017: Evaluation phase | All AC met; Submit button + evaluateCriteria + pass/fail screen; 15 unit tests + 5 e2e tests; merged PR #74 |
| GAME-016: Scenario intro slides | All AC met; full-screen slide intro from scenario.narrative; Next/Prev/Start Drawing/Skip/Escape; 6 e2e tests; merged PR #71 |
| GAME-015: Success criteria in scenario format | Already implemented: types, loader, validation, 3 criteria in tutorial-001.json — resolved on discovery |
| GAME-013: Reset-to-initial district assignments | All AC met; reset button + confirm flow + undo/redo clear; e2e tests; merged PR #63 |
| GAME-012: County border overlay toggle | All AC met; county-borders SVG layer inside zoom group; toggle button; e2e tests; merged PR #61 |
| GAME-011: Precinct info panel — hover tooltip in sidebar | All AC met; hover shows precinct detail, mouseout restores placeholder; e2e tests; merged PR #59 |
| GAME-010: Map validity panel | All AC met; population balance ±%, unassigned count, BFS contiguity; unit + e2e tests; merged PR #65 |
| GAME-009: Viewport pan and zoom | All AC met; d3.zoom() on zoom-layer group; keyboard shortcut 0 to reset; e2e tests; merged PR #55 |
| DESIGN-002: View toggle button label convention | All AC met; label shows destination mode; cycles districts↔lean; e2e tests; merged PR #57 |
| GAME-003: Author tutorial scenario JSON | All AC met; 30-precinct Kalanoa/Westford scenario; proposal + full JSON; merged PR #37 |
| CI-002: Playwright behavioral test harness | All AC met; Phase 1 smoke test (PR #38) + Phase 2 five behavioral tests (PR #50); Sprint 1 close condition satisfied |
| GAME-005: Sprint 1 integration — render scenario from JSON | All AC met; adapter + async store init + serve.sh wiring; Sprint 1 demo complete; merged PR #38 |
| GAME-001: Define scenario TypeScript types from spec | All AC met; branded types + full Scenario interface; merged PR #33 |
| GAME-002: Scenario JSON loader and validator | All AC met; loadScenario + all 13 invariants + 33 unit tests; merged PR #34 |
| GAME-004: Extract MapRenderer interface | All AC met; MapRenderer interface + SvgMapRenderer rename; merged PR #33 |
| AGENT-002: Add kotlin tools to pr-review-cycle critique/response prompts | Infra workflow already updated; local override deleted — infra workflow is canonical |
| BUILD-002: Integrate spikes into game/ Bazel workspace | Unified game/ workspace: TypeScript+D3+Zustand+Rust/WASM; all AC met; bazel build/test/run verified; merged PR #16 |
| SPIKE-001: Game tech stack PoC | TypeScript+Vite+D3.js+Zustand hex-grid prototype complete; all AC met; SPIKE-REPORT.md written; go recommendation — merged PR #11 |
| SPIKE-002: Harmonized Bazel build PoC | Bazel 9.1+bzlmod+rules_rust+rules_ts TypeScript+Rust/WASM build complete; all AC met; SPIKE-REPORT.md written; go recommendation — merged PR #13 |
| AGENT-001: $abr convention in compressed docs | Applied $-prefix to all §ABBREV key references in game-vision.compressed.md and agent-team-design.compressed.md; merged PR #2 |
| KT-001, KT-003, KT-004: Kotlin gRPC service work | Superseded — Kotlin service removed from repo; game will be a TypeScript browser app |
| BUILD-001: grpc-kotlin bzlmod migration | Superseded — Kotlin and Bazel removed; build system being re-evaluated via SPIKE-002 |
| CI-003: gRPC readiness probe for integration tests | Superseded — Kotlin service and gRPC removed |
| KT-007: DB-backed bracket config | Implemented then removed with Kotlin service |
| KT-002: Dagger 2 DI via dagger-grpc | Implemented then removed with Kotlin service |
| KT-005: JOOQ codegen | Implemented then removed with Kotlin service |
| KT-006: Database adapter layer | Implemented then removed with Kotlin service |
| DB-001: Schema migrations and tooling | Implemented then removed with Kotlin service |
| Machine-specific cache config in repo `.bazelrc` | Resolved directly; then `.bazelrc` removed with Bazel |
| Buildkite CI pipeline | Implemented; then stripped to placeholder pending stack decision |
