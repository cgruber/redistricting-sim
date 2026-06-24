---
date: 2026-06-23
session: unattended run (user AFK) — review/merge + filter toolbar
status: in-progress
---

# Playtest log — what to verify when you're back

This log captures everything done during the unattended run so you know what to
eyeball/playtest. Serve locally with `bazel run //game:serve-local`
(http://localhost:58080).

## ⚠️ Awaiting your eyeball (paused, NOT acted on)

- **West "suburb ring" around the city** — moving (−2,1)/(−2,2) into West county made
  West's inner edge read as suburbs-in-a-different-county (Portland/Vancouver pattern).
  You flagged this; I did NOT change it further. Decide on return whether to keep,
  lean into it (narrative nod), or reshape.
- **scenario-002 overall** — the old-3-county start + reapportionment narrative +
  river + rename were built and merged but you have not done a full visual playthrough.

## What changed (merged work)

(filled in as PRs land — see sections below)

## What to playtest

(checklist filled in below)
