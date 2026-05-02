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
`<absolute path to spike dir within the repo, e.g. /Users/cgruber/Projects/github/cgruber/redistricting-sim/spike/001-game-poc/>`

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
| `LEGAL-NNN` | Legal, content liability, and compliance research |
| `DIST-NNN` | Distribution, deployment, and platform research |
| `DESIGN-NNN` | Game design, UX, and ergonomics research |
| `GAME-NNN` | Game implementation work (rendering, simulation, content, game loop) |

Check **both** the Open and Resolved sections of `TICKETS.md` to find the highest existing number in a category before creating a new ticket. Ticket files are deleted when resolved, but their IDs remain in the index permanently — checking only the filesystem will miss them and cause collisions.

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

## Pull Request Conventions

### task-list-completed check

This repo runs a `task-list-completed` GitHub Actions check that scans **every** checkbox in the PR — the description body **and** all comments (inline review comments included). Any unchecked `- [ ]` box anywhere blocks the check and prevents merge.

Rules:
- Never write `- [ ]` in a PR comment unless you intend to come back and check it off.
- After a critique agent posts inline comments with `- [ ]` items (issues to fix), once each fix is applied, edit that comment to check the boxes (`- [x]`) via the GitHub API: `gh api repos/<org>/<repo>/pulls/comments/<id> -X PATCH -F body=@/tmp/...`
- The check does **not** time out or resolve on its own — it stays permanently blocking until all boxes are checked.
- To exclude an item from blocking merge, use the keywords `N/A`, `POST-MERGE`, or `OPTIONAL` in the checkbox line instead of leaving it bare and unchecked.

---

## Development Process

This project follows a **sprint-based development process** and **TDD-informed workflow**. Two documents govern how work is planned and executed — read both on every context load:

1. **Sprint roadmap**: `thoughts/shared/plans/2026-04-25-sprint-roadmap.compressed.md`
   - Checkpoint-based sprints (not time-boxed); sprint is done when demo target is met
   - Current sprint scope, backlog, and open blocking questions live here
   - Updated at sprint close (outcomes) and sprint start (scope planning)
   - **Before starting work**: check which sprint is current and what's in scope

2. **TDD workflow**: `thoughts/shared/research/2026-04-21-multi-agent-tdd-workflow.compressed.md`
   - Tests written alongside or before implementation, not as backfill
   - Every ticket includes test acceptance criteria as part of the Definition of Done
   - PRs without tests for changed behavior are incomplete

These are **mandatory reads** — especially after context compaction, where process context is lost. If you've just been loaded into a compacted context, read both before resuming work.

---

## Testing Philosophy

- Write unit tests first. Pure functions need no infrastructure.
- Prefer hand-written fakes or stubs over mock frameworks. Mocks couple tests to implementation details; fakes test behavior.
- Integration tests should cover use-case scenarios (happy path, edge cases, error paths), not chase coverage metrics.

---

## Deploying the Game

The deploy tool is `game/release.main.kts` (a Kotlin script). It replaces the old `prepare-release.sh` and `deploy.sh` shell scripts. Run it from `game/` or the repo root.

### Subcommands

**`prepare [--version v0.x.y]`**

Builds `//web:deployable` via Bazel and stages the artifact in `game/.deploy_pkg/<version>/`. The staged directory contains `artifact.zip` and `prepare-metadata.json`. It is gitignored and persists across deploys so the same build can go to multiple environments.

- **On main** (or an empty commit directly atop main): produces a semver version. Auto-bumps the patch number from the latest tag unless `--version` is passed explicitly. Creates and pushes a jj tag.
- **On any other branch**: produces `vTEST-<commitid>`. No tag is created. Safe for branch/PR testing.
- Passing an explicit semver when not on main is an error.
- Emits the version string to **stdout** so callers can capture it: `VERSION=$(./release.main.kts -- prepare)`

**`deploy --env <staging|production> [--version <v>]`**

Reads the staged artifact from `game/.deploy_pkg/<version>/` and deploys it. If `--version` is omitted, uses the sole prepared version (errors if zero or multiple exist). The `.deploy_pkg/<version>/` directory is **not** deleted after deploy — keep it to deploy the same build to production after validating on staging.

Internally: creates a jj workspace → `jj new web_deploy` → extracts zip → writes `deployment-metadata.json` → commits → sets `web_deploy` bookmark → pushes → polls verify URL → cleans up workspace.

### Typical workflows

```bash
# Branch test deploy:
VERSION=$(./release.main.kts -- prepare)                              # vTEST-<commitid>
./release.main.kts -- deploy --env staging --version "$VERSION"
# test at https://staging.pastthepost.gg
# merge PR, then do the real release from main

# Release from main:
./release.main.kts -- prepare                                         # auto-bumps semver
./release.main.kts -- deploy --env staging                            # validates
./release.main.kts -- deploy --env production                         # promotes same build
```

### Environments

| Env | URL | Verify endpoint |
|---|---|---|
| staging | https://staging.pastthepost.gg | `/deployment-metadata.json` |
| production | https://pastthepost.gg | `/deployment-metadata.json` |

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
