---
id: DESIGN-002
title: View toggle button label convention
area: design, UX
status: open
created: 2026-04-25
---

## Summary

The view toggle button currently labels itself with the **current** view mode
(e.g. "View: Districts"). This reads as descriptive — "you are here" — rather
than imperative — "go here". Users interpret it as a button that will take them
to that view, but it is already in that view. The label should instead describe
the **destination** (what clicking will do), not the current state.

## Current State

`btnViewToggle.textContent` cycles between:
- `"View: Partisan Lean"` (when in districts mode — means "clicking takes you to lean view")
- `"View: Districts"` (when in lean mode — means "clicking takes you to districts view")

This is correct behaviour but the labelling is ambiguous — "View: Districts"
could mean "you are viewing Districts" or "click to view Districts".

Source: `game/web/src/main.ts` around the `btnViewToggle` click handler.

## Goals / Acceptance Criteria

- [ ] Decide on label convention (options below) — document the choice as a
  micro-decision in the ticket or in `thoughts/shared/decisions/`
- [ ] Implement chosen convention in `main.ts`
- [ ] Verify the label change is reflected in the `sprint1.spec.ts` view-toggle
  test (or update the test if it checks button text)

## Options

**A — Imperative destination** (recommended):
- In districts mode → `"Switch to Partisan Lean"`
- In lean mode → `"Switch to Districts"`

**B — Icon + short label with tooltip**:
- Toggle icon (e.g. `⇄`) + `"Lean"` / `"Districts"`, with `title` attribute
  giving full description. More compact; requires icon or emoji.

**C — Current-state prefix, explicit action**:
- `"Districts view — click for Lean"`
- Verbose; probably too long.

Option A is the simplest and most conventional for toggle buttons.

## Notes

- This is a quick implementation fix once the design decision is made.
- Related: the button appearance (no visual indicator of active state) may also
  need polish, but that is out of scope for this ticket.

## References

- `game/web/src/main.ts` — view toggle handler and initial button text
- `game/web/e2e/sprint1.spec.ts` — view toggle test (checks fill change, not button text currently)
