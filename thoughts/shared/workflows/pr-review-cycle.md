# PR Review Cycle Workflow

Standard process for taking a local bookmark through review and merge.
Kotlin scripts live at `/opt/geekinasuit/agents/tools/`. Run any script with
`kotlin <script> -- --help` for authoritative flag reference.

---

## Steps

### Step 0 — Classify the PR

```bash
kotlin /opt/geekinasuit/agents/tools/gh-pr-diff-summary.main.kts -- --pr <N> --owner cgruber --repo redistricting-sim
```

Outputs the highest category (A/B/C/D) and required validation. Categories:
- **A** — prose/metadata (`.md`, tickets, AGENTS files): no build validation required
- **B** — config/manifests: dry-run validation where possible
- **C** — secrets: decrypt-verify before commit
- **D** — new feature/infra: document deployment, rollback, downtime in PR body

Multi-category PRs apply the highest bar.

### Step 1 — Pre-push verification

- Category A: none required
- Category B: validate with dry-run (kubectl, etc.) if applicable
- Category C: `sops decrypt` and verify — never commit unverified
- Category D: document affected services, deployment sequence, rollback plan in PR body

Run the spike's test suite if touching spike code (`npm test`, `bazel test //...`).

### Step 2 — Push and open PR

After `jj commit`, set bookmark and push:
```bash
jj bookmark set <name> -r @-
jj git push -b <name>
```

Write PR body to a temp file (never inline — see NOINLINE rule in AGENTS.md):
```bash
# Write body to /tmp/redistricting-sim-<branch>-pr-body.md
kotlin /opt/geekinasuit/agents/tools/gh-pr-create.main.kts -- \
  --title "..." --body-file /tmp/redistricting-sim-<branch>-pr-body.md \
  --owner cgruber --repo redistricting-sim
```

PR body required sections: Summary, Validation performed, Tickets addressed.
Mark inapplicable checkboxes with `N/A`, `POST-MERGE`, or `OPTIONAL` (all caps, inline)
— unchecked boxes without these keywords block the task-list-completed CI check.

### Step 3 — Critique agent (foreground — wait for completion)

Run the critique agent **first** and wait before launching the response agent.

```
kotlin /opt/geekinasuit/agents/tools/gh-pr-diff-summary.main.kts -- --pr <N> --owner cgruber --repo redistricting-sim
```

Include the diff-summary output in the critique agent's prompt. Standard critique prompt:

---
You are a code reviewer for the redistricting-sim project (cgruber/redistricting-sim).

**Available tools** — use these instead of raw `gh api` calls:
- `kotlin /opt/geekinasuit/agents/tools/gh-pr-comment.main.kts -- --pr <N> --owner cgruber --repo redistricting-sim --body-file <f> --path <file> --line <N>` — post inline comment
- `kotlin /opt/geekinasuit/agents/tools/gh-pr-comment.main.kts -- --pr <N> --owner cgruber --repo redistricting-sim --body-file <f> --reply-to <id>` — reply to thread
- `kotlin /opt/geekinasuit/agents/tools/gh-pr-threads.main.kts -- --pr <N> --owner cgruber --repo redistricting-sim` — list unresolved threads
- Always write comment bodies to a /tmp file first; never pass inline.

**Step 0 — Scope check:**
Get the diff: `gh pr diff <N> --repo cgruber/redistricting-sim`
Verify the diff matches the PR description. Flag files changed that are unrelated to the
stated purpose. If scope mismatch found: post a top-level comment and report SCOPE MISMATCH
to the caller. Stop — do not proceed with inline review.

**Step 1 — Inline review (only if scope check passes):**
Category from diff-summary: [INSERT CATEGORY HERE]
- Category A (prose): check prompt correctness, token efficiency, internal consistency
- Category B/C/D (config/secrets/infra): check safety, secrets handling, blast radius

Post inline comments only for real issues. No praise or nitpicks. If no issues: output
LGTM and stop.
---

If critique reports **SCOPE MISMATCH**: stop and notify the user. Fix scope, then re-run Step 3.
If critique reports **LGTM**: skip to Step 6.

### Step 4 — Response agent (after critique completes)

Standard response prompt:

---
You are responding to review comments on PR #<N> at cgruber/redistricting-sim.

**Available tools** — use these instead of raw `gh api` calls:
- `kotlin /opt/geekinasuit/agents/tools/gh-pr-threads.main.kts -- --pr <N> --owner cgruber --repo redistricting-sim` — list unresolved threads
- `kotlin /opt/geekinasuit/agents/tools/gh-pr-comment.main.kts -- --pr <N> --owner cgruber --repo redistricting-sim --body-file <f> --reply-to <id>` — reply to a thread
- Always write reply bodies to a /tmp file first; never pass inline.

Read the PR and all open review threads. For each thread: either apply the fix directly to
the file, or explain clearly why no change is needed. Do not push. Report what was changed
and what was left as-is with reasons.
---

### Step 5 — Re-validate and re-critique

If response agent made changes:
- Re-run any required validation (Step 1) for affected files
- Push: `jj git push -b <name>`
- Re-run Step 3

If no changes: proceed to Step 6.

### Step 6 — Pause for human input if:

- Response agent flagged a comment as requiring design/product judgment
- Tests fail after applying fixes
- Conflicting review comments
- Category D change (always pause before merge)

### Step 7 — Resolve all review threads

Reply to every thread before resolving. Reply format:
- Fixed: `Fixed — <what changed>`
- No change: `No change — <why>`

```bash
# List unresolved threads
kotlin /opt/geekinasuit/agents/tools/gh-pr-threads.main.kts -- --pr <N> --owner cgruber --repo redistricting-sim

# Resolve all threads (after replies are posted)
kotlin /opt/geekinasuit/agents/tools/gh-pr-threads.main.kts -- --pr <N> --owner cgruber --repo redistricting-sim --resolve
```

### Step 8 — Merge

Check status first:
```bash
kotlin /opt/geekinasuit/agents/tools/gh-pr-status.main.kts -- --pr <N> --owner cgruber --repo redistricting-sim
```

When all checks pass and all threads are resolved:
```bash
gh pr merge <N> --repo cgruber/redistricting-sim --squash
```

Never use `--auto`, `--admin`, or `--merge`. Squash only (keeps linear history).

**CI failures before merge:** stop and report to the user — do not merge through failing CI.

Exception for purely textual PRs (category A only): infra-level CI failures (not build/test
failures on changed content) may be treated as non-blocking if every changed file is prose
only and not referenced by any build target. Classify the failure and note it in your
report. Real failures are always blockers.

### Step 9 — Clean up after merge

```bash
jj git fetch
jj bookmark set main -r main@origin
jj rebase -b <next-bookmark> -d main   # for each in-flight bookmark
jj abandon <change-id>                  # abandon the merged change
jj bookmark delete <name>
jj git push --deleted
```

---

## Notes

- One PR at a time when PRs depend on each other — wait for merge before pushing a dependent branch.
- Never put unchecked checkboxes in review comments — use prose instead (the task-list-completed
  GitHub App scans all PR comments).
- All temp files: use unique names including repo + branch + purpose to avoid collisions with
  concurrent agents.
