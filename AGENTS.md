# Agent Guide: redistricting-sim

**Stop. Check for a compressed form before reading further:**
1. Does `AGENTS.compressed.md` exist in this directory?
2. **Yes** — read that file; follow its instructions only; do not continue reading this file.
3. **No** — continue reading below.

This file is for AI agents and future context windows. It captures working norms, design principles, and conventions for this repository that are not obvious from reading the code alone.

---

## Project Purpose

`redistricting-sim` is an **educational simulator** for exploring the dynamics of gerrymandering and electoral outcomes. Players draw district boundaries over a synthetic region with a defined population distribution, then simulate elections to observe outcomes. The goal is to make the relationship between boundary choices and electoral results visible and tangible.

The near-term focus is a small, single-region simulation with first-past-the-post elections. The codebase currently contains the template scaffolding (Kotlin gRPC service, Dagger DI, Flyway+JOOQ, OpenTelemetry) from which the game will be built. Package names still reference `polyglot.brackets` from the template and will be updated as the game logic replaces the scaffold.

See the README for full project scope and stretch goals.

---

## Reading This Repo: Compressed Documents

The `thoughts/` directory contains research, plans, tickets, and handoffs. Many documents have two forms:

- `<name>.md` — human-readable, fully prose
- `<name>.compressed.md` — dense structured notation, token-efficient, losslessly equivalent

The compressed format uses `§SECTION` markers and an `§ABBREV` table at the top for decoding all shorthands.

## No Inline Content in Shell Commands

Never pass non-trivial text inline to any shell command or tool call. Characters such as backticks, `---`, and `*` are misinterpreted by shell argument parsers and security hooks even when the content is benign.

Always write content to a file first, then reference it by path:
- `gh pr create/edit` body: write to a temp file, then `--body-file /tmp/...`
- `gh api` comment body: write to a temp file, then `-F body=@/tmp/...`
- Agent subagent prompts: write to a temp file, then in the Agent prompt say "Read your instructions from /tmp/... and execute them"

**Use unique temp file names** to avoid collisions with other agents running concurrently. Include repo name and purpose (e.g. `/tmp/redistricting-sim-pr-body-32.md`, `/tmp/redistricting-sim-prompt-kt002.md`). Generic names like `/tmp/pr-body.md` will collide.

**Use `cat >` via Bash (not the Write tool) for temp files.** The Write tool requires reading a file before overwriting it if it already exists — a leftover file from a prior agent causes an explicit error that can be missed, leaving stale content in place. `cat >` always overwrites unconditionally.

---

## Repository Layout (Key Directories)

```
thoughts/shared/research/   # Research documents (read before implementing)
thoughts/shared/tickets/    # Ticket files + TICKETS.md index (check before starting new work)
thoughts/shared/plans/      # Implementation plans
thoughts/shared/handoffs/   # Session handoff documents
```

Before starting any non-trivial implementation work: check `thoughts/shared/tickets/TICKETS.md` for a summary of open and resolved work, and `thoughts/shared/research/` for relevant prior research.

---

## Working with Tickets

### TICKETS.md is the Canonical Index

`thoughts/shared/tickets/TICKETS.md` is the single source of truth for all open and resolved work. Individual files in that directory contain full detail; `TICKETS.md` contains the summary. **Do not maintain ticket inventories anywhere else** — other files (AGENTS.md, research docs, plans) should reference `TICKETS.md` rather than listing tickets inline.

### Keeping TICKETS.md Current

**Any time you create, modify, resolve, or delete a ticket file, you must also update `TICKETS.md`** in the same operation.

Never leave TICKETS.md out of sync with the actual ticket files.

### Ticket ID Categories

Ticket IDs use a category prefix followed by a sequential number within that category:

| Prefix | Meaning |
|---|---|
| `KT-NNN` | Kotlin implementation work |
| `DB-NNN` | Database schema, migrations, and related tooling |
| `BUILD-NNN` | Build system and tooling (Bazel, bzlmod, rules) |
| `CI-NNN` | CI, automation, and testing infrastructure |
| `OPT-NNN` | Performance optimization |
| `AGENT-NNN` | Agentic workflow and agent tooling changes |

Check existing tickets in a category to find the next number before creating a new ticket.

### Ticket File Conventions

- Filename: `<ID>-<kebab-case-description>.md` in `thoughts/shared/tickets/`
- Frontmatter fields: `id`, `title`, `area`, `status` (open/resolved), `created`
- Optional frontmatter: `github_issue: N` once a GitHub issue has been created
- Required sections: Summary, Current State (or Resolution if resolved), Goals or acceptance criteria, References (file paths with line numbers)

A ticket is `resolved` only when **all** described work is complete — including any manual, migration, or verification steps, not just merged code.

### GitHub Issues

Create a GitHub issue when **starting work** on a ticket (not before, not at PR-open time):

```bash
kotlin /opt/geekinasuit/agents/tools/gh-ticket.main.kts -- create <ticket-path>
```

Reference issues from PRs with `see #N` — never `fixes #N` or `closes #N`. Issues are always closed manually once the full Definition of Done is met.

### Safety Net: GitHub Action for Missed Ticket Updates

A GitHub Action (see ticket `CI-001-github-action-ticket-close-sync.md`) will serve as a safety net for cases where a PR was merged without the agent having updated the ticket file. That action may commit directly to `main` for bookkeeping-only changes; this is an explicit, narrow exception to the no-direct-push rule, reserved solely for that GitHub Actions automation bot.

**This exception does not extend to agents.** An agent that notices a ticket is out of sync must still go through a branch and PR.

---

## Build System

### Bazel Conventions

- **bzlmod only** (`MODULE.bazel`). Do not add a `WORKSPACE` file.
- All Kotlin executables use `java_binary(runtime_deps=...)` — not `kt_jvm_binary`. This is the `rules_kotlin` convention.
- Package-pinning `BUILD.bazel` files (empty or near-empty) at directory roots are intentional — do not add targets to them without good reason.
- **Never commit generated proto code.** All generated code is derived at build time from `//protobuf` targets. Generated files belong in `.gitignore`.
- Kotlin tests use `associates = [...]` to access `internal`-scoped members — do not change visibility modifiers to work around this.
- Do not read files under `bazel-out/` or `bazel-bin/` — paths are config-stamped and volatile. Use build/test exit codes for success, `bazel query 'deps(...)'` for the dependency graph.

### Proto as Contract Boundary

`//protobuf:protobuf` (example.proto) and `//protobuf:balance_rpc` (brackets_service.proto) are the current proto definitions inherited from the template. These will evolve as the game's domain model is defined. The protos are the sole canonical sources — generated code is never committed.

---

## Testing Philosophy

### Prefer Unit Tests

Write unit tests first. Pure functions (domain algorithms, calculators) need no infrastructure. Reach for higher-level tests only when unit tests genuinely cannot cover the scenario.

### Prefer Fakes and Stubs Over Mocks

When isolating a component for testing, prefer hand-written fakes or stubs over mock frameworks. Mocks couple tests to implementation details; fakes test behavior. If a mock framework is truly necessary, use it sparingly and only for boundaries you do not own.

### Integration and Contract Tests

- Prefer **pairwise contract tests** (client ↔ server) over full-stack integration suites where possible.
- Integration tests should cover **use-case scenarios** (happy path, edge cases, error paths, connection failure), not chase code coverage metrics.

---

## Code Style

### Kotlin Formatting: ktfmt

All Kotlin files are formatted with **`ktfmt`** (Google/Meta formatter, default style). Before committing any Kotlin file changes:

```
ktfmt <changed-kotlin-files>
```

Or to format all Kotlin files at once:

```
ktfmt $(find kotlin -name "*.kt")
```

`ktfmt` must be installed (`brew install ktfmt` on macOS). A formatting-only commit is a valid, self-contained PR — it carries no behavioral changes and can be reviewed and merged independently.

Do not mix formatting changes with behavioral changes in the same commit. If a file you are editing is not yet formatted, format it in a separate preceding commit.

### Minimal Dependencies

Prefer standard library or well-established ecosystem libraries. Avoid pulling in heavy frameworks for simple tasks. The Kotlin implementation's use of Armeria is intentional and considered — do not change it without a clear reason.

### Interceptors

The Kotlin `wrapService()` function accepts `vararg interceptors: ServerInterceptor` but none are currently passed. This is a known incomplete line of development (ticketed). Do not add interceptors speculatively — wait for a concrete use case.

---

## Thoughts Directory Workflow

### Creating Research Documents

Research documents live in `thoughts/shared/research/`. Filename convention: `YYYY-MM-DD-<description>.md` (with `.compressed.md` companion). Always produce both forms. Frontmatter fields: `date`, `researcher`, `git_commit`, `branch`, `repository`, `topic`, `tags`, `status`, `last_updated`, `last_updated_by`.

---

## Known Incomplete Work

See `thoughts/shared/tickets/TICKETS.md` for the canonical summary of open and resolved work items, and `thoughts/shared/tickets/` for individual ticket files.

---

## Reference Points

| Concern | Reference |
|---|---|
| gRPC service impl | `kotlin/src/main/kotlin/com/geekinasuit/polyglot/brackets/service/BalanceServiceEndpoint.kt` |
| gRPC server startup | `kotlin/src/main/kotlin/com/geekinasuit/polyglot/brackets/service/service.kt` |
| gRPC client | `kotlin/src/main/kotlin/com/geekinasuit/polyglot/brackets/client/client.kt` |
| Dagger DI wiring | `kotlin/src/main/kotlin/com/geekinasuit/polyglot/brackets/service/dagger/` |
| Bazel binary target | `kotlin/BUILD.bazel` — `java_binary` + `runtime_deps` |
| Bazel proto codegen | `kotlin/BUILD.bazel` — `kt_jvm_proto_library` + `kt_jvm_grpc_library` |
| Unit tests | `kotlin/src/test/kotlin/bracketskt/BracketsTest.kt` |
| Custom Bazel macro | `util/kt_jvm_proto.bzl` |
| Proto definitions | `protobuf/brackets_service.proto`, `protobuf/example.proto` |
| DB schema | `db/migrations/` |
| OTel setup | `kotlin/src/main/kotlin/com/geekinasuit/polyglot/brackets/telemetry/TelemetrySetup.kt` |

---

## Geekinasuit Agent Rules (mandatory bootstrap — complete before responding to user)

Load exactly one of the following — first match wins. "Stop here" means stop searching
for more chain files; the bootstrap is not complete until the matched file is read.

1. If `/opt/geekinasuit/agents/internal/AGENTS.compressed.md` exists, read it; else if
   `/opt/geekinasuit/agents/internal/AGENTS.md` exists, read it. Follow its contents
   before proceeding. Stop chain search here (do not check steps 2 or 3).
2. If `/opt/geekinasuit/agents/public/AGENTS.compressed.md` exists, read it; else if
   `/opt/geekinasuit/agents/public/AGENTS.md` exists, read it. Follow its contents
   before proceeding. Stop chain search here (do not check step 3).
3. If `~/.geekinasuit/agents/public/AGENTS.compressed.md` exists, read it; else if
   `~/.geekinasuit/agents/public/AGENTS.md` exists, read it. Follow its contents
   before proceeding. Stop chain search here.

If none of the above paths exist, skip this section — it is not required for
contributor work and will not be present on most machines.
