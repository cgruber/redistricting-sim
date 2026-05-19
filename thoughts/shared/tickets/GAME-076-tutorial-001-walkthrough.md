---
id: GAME-076
title: Tutorial-001 guided walkthrough — overlay engine + step script
area: game, UX, tutorial
status: open
created: 2026-05-18
---

## Summary

Implement the tutorial overlay system (designed in DESIGN-012) for tutorial-001. Build the
overlay engine — step sequencing, UI element highlighting, input pause, skip/persist — and
deliver the full tutorial-001 step script guiding a new player from opening the map editor
through submitting their first attempt.

## Current State

tutorial-001 has narrative intro slides (GAME-016) but no in-game guidance once the player
enters the map editor. Players are dropped into the editor with no instructions.

## Goals / Acceptance Criteria

### Overlay engine

- [ ] Tutorial overlay panel: upper-right of map SVG, over map layer, `rgba(0,0,0,0.75)` background
- [ ] Step data model implemented per DESIGN-012 spec: text, highlight selector, pauseInput, advanceTrigger
- [ ] Highlight mechanism: CSS `tutorial-highlight` ring/glow on target; `tutorial-dimmed` on rest
- [ ] Highlight works for: named button IDs, sidebar panel divs, the map hex SVG area
- [ ] `pauseInput: true` blocks map painting + all buttons except designated advance target
- [ ] Blocked click attempts silently ignored; cursor shows `not-allowed`
- [ ] Escape key and "Skip tutorial" always active regardless of pause state
- [ ] Advance triggers implemented: `click-target`, `any-map-click`, `auto` (setTimeout), `condition`
- [ ] `condition: "5-precincts-painted"` trigger implemented for step 2
- [ ] Skip button marks `tutorial-tutorial-001-complete` in localStorage; overlay dismissed
- [ ] Tutorial not re-shown after localStorage flag set
- [ ] `?resetTutorial=1` URL param clears tutorial localStorage flags

### Tutorial-001 step script (9 steps per DESIGN-012)

- [ ] Step 1: "Welcome! Click District 2 to start painting." — highlight district-2 button, pause, click-target
- [ ] Step 2: "Click precincts to paint them as District 2." — highlight map, pause, 5-precincts condition
- [ ] Step 3: "Made a mistake? Click Undo." — highlight undo, pause, click-target
- [ ] Step 4: "Redo restores undone changes." — highlight redo, pause, click-target
- [ ] Step 5: "This panel shows map validity — contiguity and balance." — highlight validity panel, auto 4s
- [ ] Step 6: "Hover any precinct to see its data." — highlight sidebar, auto 4s
- [ ] Step 7: "Toggle between District view and Lean view." — highlight view toggle, pause, click-target
- [ ] Step 8: "County borders shows county boundaries." — highlight county button, auto 3s
- [ ] Step 9: "When ready, click Submit." — highlight submit, auto 2s, tutorial ends

### Scenario activation

- [ ] Tutorial overlay activates only when `?s=tutorial-001` (or scenario has `tutorial: true` flag)
- [ ] No overlay shown for non-tutorial scenarios

## Test Coverage

- [ ] e2e: tutorial overlay visible on tutorial-001 load (panel text matches step 1)
- [ ] e2e: step advances to step 2 on district-2 button click
- [ ] e2e: skip button dismisses overlay
- [ ] e2e: overlay not re-shown after skip (localStorage flag set)
- [ ] e2e: input blocked during paused step — painting attempt has no effect
- [ ] e2e: `?resetTutorial=1` clears flag and overlay re-appears on next load

## References

- DESIGN-012 — overlay UX spec (approve before implementation)
- `game/web/index.html` — element IDs for highlight selectors
- `game/web/src/main.ts` — editor entry point, district buttons, undo/redo
- GAME-077 — tutorial-002 (trails this; reuses overlay engine)
