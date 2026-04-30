---
id: GAME-053
title: Electoral outcome visual diff on result screen
area: game, UX
status: open
created: 2026-04-29
---

## Summary

After the player submits a map, show a visual comparison on the result screen
between what the electoral outcome would be under the player's map vs. a
baseline (e.g., proportional outcome, or the initial-assignment outcome). Helps
players understand concretely what effect their districting choices had on
election results.

## Current State

The result screen shows per-criterion pass/fail but does not show the underlying
electoral outcome (seat counts, vote shares) in a visual or comparative form.

## Goals / Acceptance Criteria

*Placeholder — spec TBD. Likely requires its own design research spike.*

- [ ] Result screen includes an electoral outcome section showing seat counts per party
- [ ] Seat counts shown for player's map alongside a reference baseline
- [ ] Visual encoding TBD (bar chart, seat grid, etc.)
- [ ] Section collapsed or secondary to avoid overwhelming the pass/fail summary

## Test Coverage

*Specify after design research.*

- [ ] e2e test: result screen includes an electoral outcome section
- [ ] e2e test: seat count totals across districts sum to the total district count

## References

- `game/web/src/simulation/election.ts` — simulation output (seat counts, vote shares)
- `game/web/src/main.ts` — result screen rendering
