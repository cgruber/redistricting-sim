---
id: GAME-094
title: Result screen overflows on smaller screens — move epilogue to a second "Continue" panel
area: game, UX
status: open
created: 2026-06-24
---

## Summary

The result screen can run taller than the viewport (verdict + subtitle + stars +
criteria list + epilogue), with no way to scroll — so the bottom (including the
teaching debrief) gets cut off. Observed on **desktop**, not just mobile. The GAME-091
epilogue made the card noticeably longer and surfaced this.

## Goals / Acceptance Criteria

- [ ] The result screen stays within the viewport on a reasonably small desktop window
      (and degrades gracefully toward mobile, though full mobile is a separate pass).
- [ ] **Preferred fix:** move the epilogue to a **second panel**. After the result
      reveal, the primary action becomes **"Continue →"** (in place of / before
      "Next Scenario →"); clicking it swaps the result card for an epilogue/debrief
      panel, which then offers "Next Scenario →".
- [ ] If a single panel is kept instead, it must use available width better and/or be
      scrollable — but the second-panel approach is preferred.
- [ ] Keyboard + screen-reader friendly (the "Continue" step is focusable; epilogue is
      announced).

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
