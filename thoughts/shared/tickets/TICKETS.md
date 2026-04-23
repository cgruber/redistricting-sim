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

---

## Open

| File | Area | Summary |
|---|---|---|
| `SPIKE-001-game-tech-stack-poc.md` | frontend, game | TypeScript + SVG/D3 + Zustand game prototype in `spike/001-game-poc/` (independent source root) |
| `SPIKE-002-harmonized-bazel-build-poc.md` | build | Bazel + rules_ts + Rust→WASM hello-world in `spike/002-build-poc/` (independent source root) |
| `CI-001-github-action-ticket-close-sync.md` | automation, github, tickets | GitHub Action safety net: sync ticket state when issue is closed without a PR ticket update |
| `AGENT-002-pr-review-cycle-kotlin-tools.md` | agentic workflow | Update infra repo pr-review-cycle to use kotlin scripts in critique/response agent prompts instead of raw gh api |

---

## Resolved

| Summary | Resolution |
|---|---|
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
