# Agent Guide: redistricting-sim

**Stop. Check for a compressed form before reading further:**
1. Does `AGENTS.compressed.md` exist in this directory?
2. **Yes** — read that file; follow its instructions only; do not continue reading this file.
3. **No** — continue reading below.

This file is for AI agents and future context windows. It captures working norms, design principles, and conventions for this repository that are not obvious from reading the code alone.

---

## Project Purpose

`redistricting-sim` is an **educational simulator** for exploring the dynamics of gerrymandering and electoral outcomes. Players draw district boundaries over a synthetic region with a defined population distribution, then simulate elections to observe outcomes. The goal is to make the relationship between boundary choices and electoral results visible and tangible.

The stack is being determined via parallel spikes (see `thoughts/shared/tickets/`). The current working direction is a TypeScript browser game with SVG/D3 map rendering and client-side election simulation. See `thoughts/shared/vision/game-vision.compressed.md` for full scope.

---

## Reading This Repo: Compressed Documents

The `thoughts/` directory contains research, plans, tickets, and handoffs. Many documents have two forms:

- `<name>.md` — human-readable, fully prose
- `<name>.compressed.md` — dense structured notation, token-efficient, losslessly equivalent

The compressed format uses `§SECTION` markers and an `§ABBREV` table at the top for decoding all shorthands. All `§ABBREV` key references in the body use `$abr` dollar-prefix format (e.g. `$ts/tickets/` not `ts/tickets/`). Definition left-sides stay bare.

## Spawning Subagents

**Always include the working directory in a subagent's prompt.** This eliminates an
entire class of navigation errors and file-not-found failures. A subagent that doesn't
know where it is will spend tokens figuring it out — or worse, silently work in the
wrong place. State it explicitly: "Your working directory is `<path>`."

Follow the **No Inline Content** rule when writing the subagent's prompt — write it to a
temp file and reference it by path.

---

## No Inline Content in Shell Commands

Never pass non-trivial text inline to any shell command or tool call. Characters such as backticks, `---`, and `*` are misinterpreted by shell argument parsers and security hooks even when the content is benign.

Always write content to a file first, then reference it by path:
- `gh pr create/edit` body: write to a temp file, then `--body-file /tmp/...`
- `gh api` comment body: write to a temp file, then `-F body=@/tmp/...`
- Agent subagent prompts: write to a temp file, then in the Agent prompt say "Read your instructions from /tmp/... and execute them"

**Use unique temp file names** to avoid collisions with other agents running concurrently. Include repo name and purpose (e.g. `/tmp/redistricting-sim-pr-body-32.md`). Generic names like `/tmp/pr-body.md` will collide.

---

## Repository Layout (Key Directories)

```
thoughts/shared/vision/     # Game vision and design documents — read first, anchors everything
thoughts/shared/research/   # Research documents (read before implementing)
thoughts/shared/tickets/    # Ticket files + TICKETS.md index (check before starting new work)
thoughts/shared/plans/      # Implementation plans
thoughts/shared/handoffs/   # Session handoff documents
spike/001-game-poc/         # SPIKE-001: game tech stack proof-of-concept (TypeScript/npm) — independent source root
spike/002-build-poc/        # SPIKE-002: harmonized Bazel build proof-of-concept — independent source root
```

Before starting any non-trivial implementation work: check `thoughts/shared/vision/game-vision.compressed.md` first, then `thoughts/shared/tickets/TICKETS.md`, then relevant `thoughts/shared/research/` docs.

**Spike directories are completely independent source roots.** Each has its own build toolchain, dependencies, and cannot import from or depend on anything outside its own directory. Agents working on a spike must only create or modify files under their designated `spike/NNN-*/` subdirectory — no changes to other repo files, no cross-spike imports.

**Spike commands** — use commands by name (e.g. `npm`, `bazel`, `node`), never by
absolute path (e.g. `/usr/local/bin/node`). All spike tooling must be on PATH. This
keeps the spike portable and avoids permission guardrails on path-specific rules.

**Spike commit workflow** — spikes use a lightweight commit discipline; full PR rigor applies only at completion:

- *During the spike:* commit locally after each logical chunk; run the spike's build and tests (`npm test`, `bazel test //...`, etc.) before each commit; squash small fixes into the relevant commit freely; no PR during active execution.
- *At completion:* when all acceptance criteria are met and `SPIKE-REPORT.md` is written, open one PR for the full spike result. Run the standard PR review cycle (critique → response → merge) at that point.

**Spike checkpointing — `PROGRESS.md`** — each spike maintains a `PROGRESS.md` in its
spike directory. Update and commit it with every logical chunk of work. A session resuming
after failure reads ticket → `PROGRESS.md` → `jj log` and has everything needed to
continue without re-doing work.

Format:

```markdown
## Working Directory
`<absolute path to spike dir>`
# Note: spikes run in jj workspaces created with `jj workspace add ../redistricting-sim-spike-NNN`.
# The spike dir is therefore a sibling of the repo root, e.g.:
# /Users/cgruber/Projects/github/cgruber/redistricting-sim-spike-001/spike/001-game-poc/

## Status: In Progress | Blocked: <reason> | Complete

## Acceptance Criteria
- [x] Completed item
- [ ] **Next up** — specific next action in one line
- [ ] Future item

## Decisions
- <non-obvious choice>: <why; what alternatives were rejected>

## Blockers / Open Questions
- <anything needing user input or an unresolved external answer>
```

Rules: `Decisions` captures only non-obvious choices — skip anything evident from reading
the ticket or the code. `Next up` is the single most valuable field; keep it to one
concrete action. The whole file should rarely exceed 30 lines.

---

## Working with Tickets

### TICKETS.md is the Canonical Index

`thoughts/shared/tickets/TICKETS.md` is the single source of truth for all open and resolved work. Individual files in that directory contain full detail; `TICKETS.md` contains the summary. **Do not maintain ticket inventories anywhere else.**

### Keeping TICKETS.md Current

**Any time you create, modify, resolve, or delete a ticket file, you must also update `TICKETS.md`** in the same operation.

### Ticket ID Categories

| Prefix | Meaning |
|---|---|
| `KT-NNN` | Kotlin implementation work (dormant — Kotlin removed) |
| `DB-NNN` | Database schema, migrations, and related tooling |
| `BUILD-NNN` | Build system and tooling |
| `CI-NNN` | CI, automation, and testing infrastructure |
| `OPT-NNN` | Performance optimization |
| `AGENT-NNN` | Agentic workflow and agent tooling changes |
| `SPIKE-NNN` | Time-boxed proof-of-concept investigations |

Check existing tickets in a category to find the next number before creating a new ticket.

### Ticket File Conventions

- Filename: `<ID>-<kebab-case-description>.md` in `thoughts/shared/tickets/`
- Frontmatter fields: `id`, `title`, `area`, `status` (open/resolved), `created`
- Optional frontmatter: `github_issue: N` once a GitHub issue has been created
- Required sections: Summary, Current State (or Resolution if resolved), Goals or acceptance criteria, References (file paths with line numbers)

A ticket is `resolved` only when **all** described work is complete.

### GitHub Issues

Create a GitHub issue when **starting work** on a ticket (not before, not at PR-open time):

```bash
# gh-ticket.main.kts is a Kotlin script run via the external kotlin CLI (not the removed Kotlin service)
kotlin /opt/geekinasuit/agents/tools/gh-ticket.main.kts -- create <ticket-path>
```

Reference issues from PRs with `see #N` — never `fixes #N` or `closes #N`.

---

## Testing Philosophy

- Write unit tests first. Pure functions need no infrastructure.
- Prefer hand-written fakes or stubs over mock frameworks. Mocks couple tests to implementation details; fakes test behavior.
- Integration tests should cover use-case scenarios (happy path, edge cases, error paths), not chase coverage metrics.

---

## Creating Research Documents

Research documents live in `thoughts/shared/research/`. Filename convention: `YYYY-MM-DD-<description>.md` (with `.compressed.md` companion). Always produce both forms. Frontmatter fields: `date`, `researcher`, `git_commit`, `branch`, `repository`, `topic`, `tags`, `status`, `last_updated`, `last_updated_by`.

---

## Geekinasuit Agent Rules (mandatory bootstrap — complete before responding to user)

Load exactly one of the following — first match wins:

1. If `/opt/geekinasuit/agents/internal/AGENTS.compressed.md` exists, read it; else if `/opt/geekinasuit/agents/internal/AGENTS.md` exists, read it. Stop chain search here.
2. If `/opt/geekinasuit/agents/public/AGENTS.compressed.md` exists, read it; else if `/opt/geekinasuit/agents/public/AGENTS.md` exists, read it. Stop chain search here.
3. If `~/.geekinasuit/agents/public/AGENTS.compressed.md` exists, read it; else if `~/.geekinasuit/agents/public/AGENTS.md` exists, read it. Stop chain search here.

If none of the above paths exist, skip — not required for contributor work.
