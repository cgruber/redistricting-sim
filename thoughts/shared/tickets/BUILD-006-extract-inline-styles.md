---
id: BUILD-006
title: Extract inline styles to external CSS file
area: build, security
status: open
created: 2026-04-27
---

## Summary

Move the inline `<style>` block in `game/web/index.html` to an external
`styles.css` file loaded via `<link>`. This enables removing `'unsafe-inline'`
from the CSP style-src directive (BUILD-005), reaching strict CSP.

## Current State

All CSS is in a single `<style>` block in index.html `<head>` (~450 lines).
BUILD-005 adds CSP with `style-src 'self' 'unsafe-inline'` as a temporary
allowance for this inline block.

## Goals / Acceptance Criteria

- [ ] Extract `<style>` content to `game/web/styles.css`
- [ ] Replace `<style>` block with `<link rel="stylesheet" href="styles.css">`
- [ ] Update CSP: `style-src 'self'` (drop `'unsafe-inline'`)
- [ ] Update Bazel BUILD: include `styles.css` in serve data + e2e test data
- [ ] All e2e tests pass; no visual regressions

## References

- BUILD-005 — CSP meta tag (do first; this ticket tightens it)
- TRIAGE-001 security analysis (2026-04-27)
