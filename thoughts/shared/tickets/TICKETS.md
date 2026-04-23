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
| `KT-NNN` | Kotlin implementation work |
| `DB-NNN` | Database schema, migrations, and cross-language DB tooling |
| `BUILD-NNN` | Build system and tooling (Bazel, bzlmod, rules) |
| `CI-NNN` | CI, automation, and testing infrastructure |
| `OPT-NNN` | Performance optimization |
| `AGENT-NNN` | Agentic workflow and agent tooling changes |

---

## Open

| File | Area | Summary |
|---|---|---|
| `KT-004-kotlin-docker-deployment.md` | kotlin, docker, deployment | Docker container build for Kotlin service; staging + production profiles |
| `CI-001-github-action-ticket-close-sync.md` | automation, github, tickets | GitHub Action safety net: sync ticket state when issue is closed without a PR ticket update |
| `BUILD-001-grpc-kotlin-bzlmod-migration.md` | kotlin, bazel, grpc | Migrate to bzlmod-native `grpc_kotlin` when upstream supports it |
| `KT-001-kotlin-grpc-interceptors-not-implemented.md` | kotlin, grpc | `wrapService()` interceptor hook exists but no interceptors implemented |
| `KT-003-kotlin-dagger-client-di.md` | kotlin, grpc, di | Dagger DI for the gRPC client binary; prereq: server DI ticket |
| `CI-003-integration-test-grpc-readiness-probe.md` | ci, testing, kotlin | Replace TCP readiness check with gRPC-level probe; root cause of socket-disconnection flakes on startup |

---

## Resolved

| Summary | Resolution |
|---|---|
| AGENT-001: $abr convention in compressed docs | Applied $-prefix to all §ABBREV key references in game-vision.compressed.md and agent-team-design.compressed.md; merged PR #2 |
| KT-007: DB-backed bracket config | Implemented: `BracketPairRepository` (JOOQ), `BracketsDbModule`, `BracketsServiceTelemetry`, `@GrpcCallScope` endpoint wiring, tests; merged in PR #50 |
| KT-002: Dagger 2 DI via dagger-grpc | `ApplicationGraph` @Component, `GrpcCallScopeGraph` subcomponent, all service modules, `@Inject` constructors |
| KT-005: JOOQ codegen | `JooqCodegenRunner`, Bazel genrule + `jooq_db_lib`, DDLDatabase codegen from migration SQL, generated files gitignored; merged in PR #45 |
| KT-006: Database adapter layer | `DatabaseConfig`, HikariCP + Flyway + JOOQ `DSLContext` wiring, `BracketsDbModule`, runfiles+classpath migration resolution; merged in PR #48 and #52 |
| DB-001: Schema migrations and tooling | `db/migrations/20260421000000_create_bracket_pair.sql`, dbmate+Flyway compatible format, Bazel filegroup + classpath resource targets; merged in PR #43 and #52 |
| Machine-specific cache config in repo `.bazelrc` | Resolved directly: `--disk_cache` and `--remote_cache` lines removed from `.bazelrc`; developers configure cache in `user.bazelrc` (gitignored) or `~/.bazelrc` |
| Buildkite CI pipeline (issue #13, PR #14) | Implemented pipeline: Linux steps via Docker plugin, macOS steps on native agent (`os=macos`). Fixes during stabilization: cluster assignment, arch-aware bazelisk download, `build-essential` for `rules_cc`, `$$`-escaped Buildkite variable interpolation in Docker command blocks. |
