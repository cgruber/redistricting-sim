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
| `GAME-006-scenario-compression.md` | game, build | Compressed scenario delivery: HTTP gzip for bundled; `.scenarioz` format for future downloads |
| `GAME-007-player-progress-persistence.md` | game, storage | Save/resume in-progress scenario + completion tracking; "Continue" menu; localStorage |
| `CI-001-github-action-ticket-close-sync.md` | automation, github, tickets | GitHub Action safety net: sync ticket state when issue is closed without a PR ticket update |
| `LEGAL-001-content-presentation-risks.md` | legal, content | Research legal risk from partial/no eligibility-restriction warnings in sim authoring tool |
| `DIST-001-steam-deployment-research.md` | distribution, platform | Research Steam free/educational program, achievements API, web-vs-Steam tradeoffs |
| `DESIGN-001-achievement-star-system.md` | design, UX | Game ergonomics research for star/achievement ranking system (required vs. optional criteria) |
| `AGENT-003-infra-pr-review-bot-comment-handling.md` | agentic workflow, infra | Propose bot comment handling (Copilot, CodeQL) to infra pr-review-cycle workflow |
| `DESIGN-002-view-toggle-ux.md` | design, UX | View toggle button label convention: show destination mode, not current mode |
| `DESIGN-003-districts-view-color-encoding.md` | design, UX | Districts view color/population gradient: decide encoding strategy for v1 |
| `GAME-008-accessibility.md` | game, accessibility | Full a11y pass: color-blind-safe palettes, ARIA labels, keyboard nav, screen reader support |
| `GAME-009-pan-zoom.md` | game, rendering | Pan + zoom via d3.zoom(); scroll wheel + keyboard shortcuts; zoom-invariant stroke widths |
| `GAME-010-map-validity-panel.md` | game, rendering | Live validity panel: per-district pop balance ±%, unassigned count, contiguity status |
| `GAME-011-precinct-info-panel.md` | game, rendering | Precinct hover info in sidebar (name, district, population); replaces status bar |
| `GAME-012-county-border-overlay.md` | game, rendering | County border overlay toggle; flavor only; computed from county_id adjacency edges |
| `GAME-013-reset-to-initial.md` | game, rendering | Reset all assignments to scenario initial state; clears undo history; confirmation required |

---

## Resolved

| Summary | Resolution |
|---|---|
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
