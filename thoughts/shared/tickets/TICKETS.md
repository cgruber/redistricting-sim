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
| `GAME-003-tutorial-scenario-content.md` | game, content | Author tutorial scenario JSON (sketch proposal first, then full data file) |
| `GAME-005-render-scenario-from-json.md` | game, rendering | Sprint 1 demo: wire loader + scenario into renderer; replace procedural generator |
| `GAME-006-scenario-compression.md` | game, build | Compressed scenario delivery: HTTP gzip for bundled; `.scenarioz` format for future downloads |
| `GAME-007-player-progress-persistence.md` | game, storage | Save/resume in-progress scenario + completion tracking; "Continue" menu; localStorage |
| `CI-001-github-action-ticket-close-sync.md` | automation, github, tickets | GitHub Action safety net: sync ticket state when issue is closed without a PR ticket update |
| `CI-002-playwright-behavioral-tests.md` | ci, testing, automation | Playwright behavioral test harness: Phase 1 (framework + smoke test) in S1 parallel; Phase 2 (scenario/paint/undo/view tests) after GAME-005 |
| `LEGAL-001-content-presentation-risks.md` | legal, content | Research legal risk from partial/no eligibility-restriction warnings in sim authoring tool |
| `DIST-001-steam-deployment-research.md` | distribution, platform | Research Steam free/educational program, achievements API, web-vs-Steam tradeoffs |
| `DESIGN-001-achievement-star-system.md` | design, UX | Game ergonomics research for star/achievement ranking system (required vs. optional criteria) |

---

## Resolved

| Summary | Resolution |
|---|---|
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
