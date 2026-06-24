---
id: GAME-094
title: Result screen overflow — second-panel epilogue + scrollable criteria
area: game, UX
status: resolved
created: 2026-06-24
---

## Summary

The result screen can run taller than the viewport (verdict + subtitle + stars +
criteria list + epilogue), with no way to scroll — so the bottom (including the
teaching debrief) gets cut off. Observed on **desktop**, not just mobile. The GAME-091
epilogue surfaced it, but the criteria list alone can overflow with enough criteria.

## Resolution

- **Second-panel epilogue:** the result card now has a `#result-main` (verdict, stars,
  criteria, actions) and a `#result-debrief` panel (the teaching epilogue). On a win
  with an epilogue, the action is **"Continue →"** (`#btn-continue`) → swaps to the
  debrief panel ("What just happened" + epilogue + "Next Scenario →" + "← Back to
  results"). With no epilogue, "Next Scenario →" shows directly as before; on a loss,
  neither (keep drawing). `preparePostWin()` drives this from both the reveal and the
  debug-replay recompute.
- **Scrollable baseline:** `#result-card` capped at `max-height: 90vh`; the criteria
  list and the epilogue each `overflow-y: auto` with `min-height: 0`, so neither can
  push the card off-screen regardless of criterion count.
- e2e: scenario-002 winnability now clicks "Continue →", asserts the debrief panel +
  epilogue, and "← Back" returns to the results view.

## Notes

- This is the natural home for the result-screen "reveal → debrief" flow; the epilogue
  is the teaching payoff and reads better with its own space.
- Mobile layout is a larger, separate effort — but this fix should already keep the UI
  usable on a smaller screen.

## References

- `game/web/index.html` (#result-screen / #result-card / #result-epilogue),
  `game/web/src/main.ts` (result reveal, #btn-next-scenario), `game/web/styles.css`.
- Introduced the overflow: GAME-091 (`narrative.epilogue` on the result screen).
- Relates to DESIGN-015 (information-density redesign), GAME-008 (accessibility).
