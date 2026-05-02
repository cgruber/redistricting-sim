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
| `BUILD-008-switch-ci-to-pnpm.md` | build, ci | Switch CI from npm ci to pnpm --frozen-lockfile; remove package-lock.json |
| `BUILD-009-content-hash-bundle.md` | build, deployment | Content-hashed bundle filenames (`bundle-[hash].js`) for proper CDN cache invalidation on deploy; replaces query-string kludge in release.main.kts |
| `CI-001-github-action-ticket-close-sync.md` | automation, github, tickets | GitHub Action safety net: sync ticket state when issue is closed without a PR ticket update |
| `DIST-001-steam-deployment-research.md` | distribution, platform | Research Steam free/educational program, achievements API, web-vs-Steam tradeoffs |
| `AGENT-003-infra-pr-review-bot-comment-handling.md` | agentic workflow, infra | Propose bot comment handling (Copilot, CodeQL) to infra pr-review-cycle workflow |
| `DESIGN-004-legend-layout.md` | design, UX | Move legend to horizontal strip above map; free sidebar space for data panels |
| `DESIGN-005-population-dot-density-overlay.md` | design, rendering | Population dot density overlay: dot count per precinct proportional to population; hue-aware dot color; colorblind-safe palette |
| `DESIGN-006-zoom-adaptive-dot-density.md` | design, rendering | Zoom-adaptive dot density scaling + person glyph threshold (refinement on DESIGN-005, possibly post-v1) |
| `DESIGN-007-dimensional-dot-map-demographic-overlay.md` | design, rendering | Dimensional dot map: demographic dimension switching (Option B adaptive encoding) + sorted placement toggle |
| `GAME-056-playtest-feedback.md` | game, content, UX | Capture and act on playtest feedback — scenario balance and UX |
| `GAME-057-scenario-randomization.md` | game, content, replayability | Per-session ±5% population/lean offsets seeded per session; e2e tests remain deterministic |
| `GAME-058-manual-playability-test-thresholds.md` | game, content, QA | Manual playthrough of scenarios 007 and 008 to verify tightened thresholds (GAME-031) feel right |
| `GAME-030-main-menu-and-campaigns.md` | game, UX, architecture | Main menu, campaign model, campaign select, layered navigation; replaces scenario-select-as-home |
| `DESIGN-008-geographic-features.md` | design, rendering | Geographic features (lakes=aqua+wave, mountains=grey+hatch) as decorative non-precinct tiles; blocks contiguity |
| `GAME-041-split-loader.md` | game, code-quality | Split loader.ts: extract runtime-types.ts primitives; name validateScenario() internally |
| `GAME-042-break-up-main.md` | game, code-quality | Break up main.ts god module into testable units (scenarioSelect, resultScreen, introFlow) |
| `GAME-043-unify-type-systems.md` | game, code-quality | Unify spike and scenario type systems; retire adapter.ts and types.ts spike layer |
| `GAME-046-panels-unit-tests.md` | game, testing | Unit tests for render/panels.ts (deferred): jsdom or extract-pure-helpers approach |
| `GAME-053-electoral-outcome-visual-diff.md` | game, UX | Electoral outcome comparison (player map vs baseline) on result screen; placeholder |
| `DESIGN-009-character-reaction-visual-style.md` | design, UX, art | Art style, character roster, animation approach, and audio tone for result screen reactions |
| `GAME-059-submit-on-invalid.md` | game, UX | Allow submission of invalid maps; failure animations play; Fix-It path replaces Next Scenario |
| `GAME-060-character-sprite-assets.md` | game, art, content | Character sprite + animation assets (5 types × pass/fail); AI-generated SVG; depends on DESIGN-009 |
| `GAME-061-audio-clips.md` | game, audio, content | 10 audio clips (5 types × pass/fail); CC0 preferred; AI-generated fallback; depends on DESIGN-009 |
| `GAME-062-character-reaction-system.md` | game, UX | Wire character sprites + audio to result screen; replaces emoji placeholder; depends on GAME-060/061/063/064 |
| `GAME-063-asset-pipeline.md` | game, build, infrastructure | Asset directory structure + Bazel integration for SVG + audio delivery |
| `GAME-064-audio-playback-infrastructure.md` | game, UX, infrastructure | AudioPlayer module: preload, play, mute toggle, autoplay policy, localStorage persistence |

---

## Resolved

| Summary | Resolution |
|---|---|
| GAME-052: animated criteria reveal | CSS criterionReveal keyframe (opacity+translateY), 120ms stagger, click-to-skip, 🎉/💔 reaction; 4 e2e tests; merged PR #189 |
| GAME-031: gameplay critique followup | Tightened pop tolerance (007/008: 10%→5%); compactness 007: 0.40→0.50; randomization→GAME-057; others deferred or rejected |
| DESIGN-001: achievement/star system research | Variable per-criterion stars: 1 base + 1 per optional criterion; no format change needed; fixed-3 rejected; research doc written 2026-05-02 |
| GAME-055: scenario-driven party names | `renderResults()` accepts partyLabels param; scenario party names (Ken/Ryu, Cat/Dog) shown in results panel; fallback to "Party 1"/"Party 2"; 2 e2e tests; merged PR #180 |
| GAME-008: full accessibility pass | Okabe-Ito CVD-safe district palette, PuOr lean view, aligned party colors, keyboard precinct nav (arrow+number keys), focus rings, prefers-reduced-motion, 6 e2e a11y tests; merged PR #177, deployed v0.0.13 |
| LEGAL-001: content risk assessment | Low risk for v1; all pre-authored content, fictional entities, educational framing; disclaimers added to about page + Valle Verde; authoring tool deferred to post-v1 review |
| GAME-006: scenario compression | HTTP gzip sufficient for v1; no code changes needed; .scenarioz deferred to community scenarios |
| GAME-038: extract panel renderers | render/panels.ts created with renderResults, renderLegend, renderDistrictButtons, renderValidityPanel; mapRenderer.ts reduced by ~115 lines; main.ts import updated |
| GAME-039: extract hex geometry | hex-geometry.ts created with hexToPixel, hexCorners, mapBounds, HEX_DIRECTIONS; generator.ts re-exports from it; adapter.ts + mapRenderer.ts updated; hex_geometry_lib added to model BUILD |
| GAME-044: hex-geometry unit tests | 11 unit tests for hexToPixel, hexCorners, HEX_DIRECTIONS, mapBounds; hex_geometry_test Bazel target in model/BUILD.bazel; merged PR #153 |
| GAME-054: remove legacy scenario select | ?campaign=bogus+?view=scenarios+unknown ?s=+locked (no campaign) all redirect to main menu; ?s= in campaign→show campaign select; backUrl updated; 89 e2e tests pass; merged PR #172 |
| GAME-051: in-game navigation cleanup | ← Scenarios replaced with submenu trigger; Return to Scenarios (campaign only) + Return to Main Menu; no-campaign shows flat ← Main Menu button; Escape+outside-click close; 6 e2e tests; 102 total pass |
| GAME-049: campaign select screen | ?view=campaigns→campaign cards with progress indicators; click→?campaign=<id>; Back→main menu; tabindex+keydown a11y; 6 e2e tests; merged PR #169 |
| GAME-050: main menu / title screen | Continue/New Campaign/About/Load+Settings(disabled); routing /→main menu; 9 e2e tests; merged PR #165 |
| GAME-048: campaign-driven scenario select | ?campaign= URL param filtering + Back button + input sanitization + cache-bust warn; 5 e2e tests; merged PR #162 |
| GAME-047: campaign data model | Campaign interface + CAMPAIGN_REGISTRY + getCampaign() + save/loadLastPlayedScenario(); Tutorial (2 scenarios) + Educational (8 scenarios); 13 unit tests; merged PR #159 |
| GAME-045: gameStore unit tests | 13 unit tests for initial state, setActiveDistrict, paintPrecinct, paintStroke, resetToInitial, restoreAssignments, undo via zundo; store/BUILD.bazel package created; react added as devDep; merged PR #153 |
| BUILD-007: shared TAP test runner | test_runner.ts extracted to game/web/src/testing/; 9 exports (test, assertEqual, assertClose, assertNull, assertNotNull, assertTrue, assertFalse, assertDeepEqual, assertThrows, summarize); boilerplate eliminated from 4 existing test files |
| GAME-033: opLabel dedup | Single OP_LABEL module-level const in evaluate.ts replaces 4 inline copies; evaluate_test passes with no behavior change |
| GAME-034: error panel dedup | showLoadError(bodyHtml, errorMsg) helper in main.ts replaces 2 identical insertAdjacentHTML blocks; both error paths preserved |
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
