---
id: DESIGN-012
title: Tutorial overlay UX — step-by-step guided walkthrough design
area: design, UX, tutorial
status: open
created: 2026-05-18
---

## Summary

Design the step-by-step tutorial overlay system that guides new players through the game UI
during tutorial-001 and tutorial-002. The overlay displays contextual instructions in the
upper-right of the map (over the map layer, not in the sidebar), highlights relevant UI
elements, optionally pauses input, and advances through a scripted sequence. This design doc
must answer: sequencing model, highlight mechanics, input-pause semantics, skip/dismiss rules,
skip-tutorial persistence, and the content format for tutorial steps — before GAME-076
implementation begins.

## Design questions to resolve

1. Advance triggers: click-target only, or also any-click / auto-advance-after-N-seconds?
2. Highlight mechanism: CSS ring/glow on target + dim surroundings, or pointer arrow, or both?
3. Can a highlight target be a hex region (the map itself) or only named elements?
4. Panel repositioning: does the panel move if it would obscure the highlighted element?
5. Input pause granularity: block all input, or only non-target input?

## Positioning and layout spec

- Overlay panel: upper-right corner of the map SVG, over the map layer
- Semi-transparent dark background (`rgba(0,0,0,0.75)` or similar)
- Panel width ~220–260px; readable without obscuring map center
- If highlighted element is in upper-right, panel may shift left or downward (anti-obstruction)

## Step data model

Each tutorial step is an object:

```typescript
interface TutorialStep {
  text: string;                    // instruction text shown in panel
  highlight?: string;              // CSS selector for element to highlight
  pauseInput: boolean;             // block all non-target interactions
  advanceTrigger:
    | { type: "click-target" }     // advance when highlighted element is clicked
    | { type: "any-map-click" }    // advance on any precinct click
    | { type: "auto"; delayMs: number }  // advance after N ms
    | { type: "condition"; event: string }  // advance on named game event
  ;
}
```

Tutorial is a named array of steps keyed by scenario ID or campaign type.

## Highlight mechanics

- Target element receives a CSS class (e.g. `tutorial-highlight`) that adds a glowing ring
- All other interactive elements receive a `tutorial-dimmed` class (reduced opacity, pointer-events: none)
- Highlight must work for: buttons, sidebar panels, the map hex area
- Highlighting a specific precinct: use precinct ID to locate the SVG path and apply ring
- Highlight is non-destructive: CSS overlay only, does not affect element functionality

## Input pause semantics

- When `pauseInput: true`: all map painting and button interactions blocked except the
  designated advance target
- Escape key and "Skip tutorial" button remain active during any pause
- Visual affordance: blocked elements show `not-allowed` cursor
- Blocked click attempts are silently ignored (no error, no visual feedback)

## Skip / disable

- "Skip tutorial" button always visible in tutorial overlay panel
- Skipping marks tutorial as completed in localStorage key `tutorial-<scenarioId>-complete`
- Tutorial not re-shown after completion on replay (courtesy skip)
- Tutorial campaign remains accessible; skip does not remove it
- Reset: `?resetTutorial=1` URL param clears localStorage flag (for testing / fresh replays)
- Full settings-panel reset hookup deferred to GAME-070 / settings sprint

## Tutorial-001 step script (proposed — finalize during GAME-076 implementation)

| Step | Text | Highlight | Pause | Advance |
|------|------|-----------|-------|---------|
| 1 | "Welcome! Click **District 2** to start painting." | `#btn-district-2` | yes | click-target |
| 2 | "Now click precincts on the map to paint them as District 2." | map hex area | yes | condition: 5-precincts-painted |
| 3 | "Made a mistake? Click **Undo** to go back." | `#btn-undo` | yes | click-target |
| 4 | "**Redo** restores changes you undid." | `#btn-redo` | yes | click-target |
| 5 | "This panel shows map validity — all districts must be contiguous and balanced." | validity panel | no | auto 4000ms |
| 6 | "Hover any precinct to see its population and lean data." | sidebar precinct panel | no | auto 4000ms |
| 7 | "Toggle between **District view** and **Lean view** here." | `#btn-view-toggle` | yes | click-target |
| 8 | "**County borders** shows county boundaries as an overlay." | `#btn-county-borders` | no | auto 3000ms |
| 9 | "When you're happy with your map, click **Submit**." | `#btn-submit` | no | auto 2000ms (tutorial ends) |

## Tutorial-002 step script (sketched — finalize in GAME-077)

Tutorial-002 is a 196-precinct map with 4 districts. Proposed themes:
- Criteria panel: what each criterion means, how to read pass/fail
- Demographic overlay: switching between party lean and demographic views
- Goal orientation: the scenario has an explicit majority_minority criterion; walk the player
  toward understanding what "the minority community needs an effective district" means in
  map terms

## Goals / Acceptance Criteria

- [ ] Step data model finalized and documented
- [ ] Highlight mechanics spec finalized (CSS approach; targets; dimming)
- [ ] Input pause semantics fully specified
- [ ] Skip / disable behavior specified (localStorage key, reset mechanism)
- [ ] Tutorial-001 step script reviewed and signed off (9 steps above, or revised)
- [ ] Tutorial-002 themes outlined (details finalized in GAME-077)
- [ ] Panel positioning and anti-obstruction rule specified

## References

- GAME-076 — tutorial-001 implementation (trails this)
- GAME-077 — tutorial-002 (trails GAME-076)
- `game/web/index.html` — element IDs for highlight selectors
- `game/web/styles.css` — overlay/panel styling conventions
