---
id: AGENT-002
title: Add kotlin tools reference to pr-review-cycle critique/response agent prompts
area: agentic workflow, tooling
status: resolved
created: 2026-04-23
---

## Summary

Critique and response agents consistently use raw `gh api` calls instead of the
established kotlin scripts in `/opt/geekinasuit/agents/tools/`. The scripts exist
precisely to make these operations reliable and consistent. Two places need updating:

1. **This repo's** `thoughts/shared/workflows/pr-review-cycle.md` — done (PR #9)
2. **The infra repo's** `/opt/geekinasuit/agents/internal/workflows/pr-review-cycle.md`
   — tracked by this ticket; requires a PR to `geekinasuit/infra`

## Current State

The infra repo's `pr-review-cycle.md` (§STEP3 critique prompt) currently instructs:
> "Use `gh api` to post comments."

And §STEP7 uses raw GraphQL `gh api graphql` calls for thread resolution instead of
`gh-pr-threads.main.kts`.

## Goals / Acceptance Criteria

- [ ] `pr-review-cycle.md` in `geekinasuit/infra` updated to include a "Available tools"
      preamble in the §STEP3 critique prompt and §STEP4 response prompt, listing:
      - `gh-pr-comment.main.kts` for inline comments and thread replies (body from file only)
      - `gh-pr-threads.main.kts` for listing and resolving threads
- [ ] §STEP7 updated to use `gh-pr-threads.main.kts` instead of raw graphql
- [ ] `pr-review-cycle.compressed.md` in `geekinasuit/infra` updated to match

## Resolution

Resolved via a different path than originally scoped. When re-examined, the infra repo
workflow (`/opt/geekinasuit/agents/internal/workflows/pr-review-cycle.compressed.md`)
already contained the kotlin-tools preamble in §STEP3/§STEP4 and used `gh-pr-threads.main.kts`
in §STEP7 — the infra update had already been applied outside this ticket's tracking.

The local override (`thoughts/shared/workflows/pr-review-cycle.*`) was not loaded by the
bootstrap chain and was therefore redundant. It was deleted in PR #26.

The original AC items were rendered moot by the pre-existing infra update.

## References

- Tool catalog: `/opt/geekinasuit/agents/internal/TOOLS.compressed.md`
- Infra repo: `/Users/cgruber/Projects/github/geekinasuit/infra`
