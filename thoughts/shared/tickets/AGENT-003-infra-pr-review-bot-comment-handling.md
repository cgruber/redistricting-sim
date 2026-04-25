---
id: AGENT-003
title: Propose bot comment handling to infra pr-review-cycle workflow
area: agentic workflow, infra
status: open
created: 2026-04-25
---

## Summary

The `geekinasuit/infra` project owns the `pr-review-cycle` workflow that agents follow
(`/opt/geekinasuit/agents/internal/workflows/pr-review-cycle.md`). That workflow currently
covers responding to and resolving human reviewer threads (Steps 4 and 7), but does not
address bot-generated review comments.

During PR #47 review in this project, GitHub Copilot code review and CodeQL were configured
as required ruleset checks. The workflow gave no guidance on how to handle bot review
threads — whether to respond, how to resolve them, or what to do when a bot check blocks
merge. This gap caused confusion and manual intervention.

## Current State

Steps 4 and 7 in `pr-review-cycle.md` scope "open review comments" to human reviewers.
Bot comments (Copilot code review, CodeQL annotations, automated linting bots) are not
mentioned. There is no guidance on:

- Whether bot comments should be addressed like human comments or treated differently
- How to trigger a bot re-review (e.g., if Copilot hasn't posted for a docs-only PR)
- What to do when a bot review is a required status check that hasn't fired

## Goals / Acceptance Criteria

- [ ] Propose to the infra project (via PR to `geekinasuit/infra`) that Steps 4 and 7 of
      `pr-review-cycle.md` (and its compressed sibling) explicitly cover bot-generated
      review comments alongside human ones.
- [ ] Proposal should include guidance on:
  - Bot comments should be addressed in the response agent pass (Step 4) just like human
    comments — reply and resolve.
  - When a required bot check (Copilot, CodeQL) hasn't fired: try close/reopen; if still
    absent, check if the rule applies (e.g., code scanning only runs when code changes exist);
    escalate to user if still blocked.
  - Bot thread resolution follows the same pattern as human threads (reply first, then
    resolve via `gh-pr-threads --resolve`).
- [ ] Both `.md` and `.compressed.md` forms updated in the infra PR.

## References

- `pr-review-cycle.compressed.md`: `/opt/geekinasuit/agents/internal/workflows/pr-review-cycle.compressed.md`
- Incident: PR #47 in `cgruber/redistricting-sim` — Copilot review rule blocked merge;
  CodeQL didn't fire on docs-only PR; no workflow guidance existed for either situation.
