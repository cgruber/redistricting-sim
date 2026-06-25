---
id: GAME-076
title: Guided-overlay engine + tutorial-001 paint-only walkthrough
area: game, UX, tutorial
status: resolved
created: 2026-05-18
---

## Resolution

Shipped in **PR #275** (squash-merged to main). `game/web/src/tutorial/overlay.ts` implements
the guided-overlay engine per DESIGN-012 (step model; `next`/`click-target`/`any-map-click`/
`paint-count`/`submit`/`auto` advance; input-pause via the pointer-events cascade; `reveal`
action built but unexercised until T3; Skip/Escape + per-scenario `localStorage` complete flag;
`?resetTutorial=1`). `guided: true` plumbed (spec → assembler → scenario → loader) and set on
tutorial-001; `startTutorialOverlay()` runs from `showEditor()`; `data-district="N"` hook on
paint buttons; coach-panel + ring + pause CSS. e2e covers the walkthrough + suppression; a
file-level `beforeEach` keeps the overlay out of the other tutorial-001 tests. Owner playtested
and approved.

## Summary

Build the guided-overlay engine designed in DESIGN-012 and deliver the **tutorial-001**
walkthrough: a paint-only welcome that coaches the player through select → paint → submit.
The engine (step sequencing, highlight/dim, input-pause, skip/persist, `reveal` action) is
built here and reused by GAME-077 for tutorial-002.

Supersedes the original 9-step script — that targeted removed header buttons and walked the
validity panel / lean / county views, none of which exist in the redesigned paint-only T1
(GAME-097). See the revised script in DESIGN-012.

## Current State

tutorial-001 ships (GAME-097) as a 37-precinct hex circle, paint-and-submit, with the view
toolbar / legend / results / validity panels hidden. It has narrative intro slides but no
in-editor coaching once the player enters the map.

## Goals / Acceptance Criteria

### Engine (per DESIGN-012)

- [ ] `guided: true` scenario flag plumbed (spec → assembler → scenario → loader); overlay
      runs only for guided scenarios with a registered step script. No overlay otherwise.
- [ ] Step model implemented: `text`, `highlight?`, `reveal?`, `pauseInput?`, `advance`
      (`click-target` | `any-map-click` | `paint-count` | `submit` | `auto` | `next`).
- [ ] Instruction panel over the map (upper area, semi-transparent), anti-obstruction shift.
- [ ] Highlight (`tutorial-highlight` ring) + dim (`tutorial-dimmed`); works for button ids,
      `#map-svg`, and a specific `.district-btn`.
- [ ] Stable hook added to district paint buttons (e.g. `data-district="N"`) for targeting.
- [ ] `pauseInput` blocks all input except the advance target; Escape + Skip always active.
- [ ] `reveal` action: collect reveal selectors across the script, hide them on load
      (tutorial-local), un-hide each on its step. (Exercised by GAME-077; built here.)
- [ ] Skip control always visible; sets `localStorage["tutorial-<id>-complete"]`; not
      re-shown after; `?resetTutorial=1` clears flags.

### tutorial-001 script (5 steps, per DESIGN-012)

- [ ] 1 Orient: "This whole county is District 1 — split it into two." (next)
- [ ] 2 Highlight District 2 button → "Pick District 2." (pause, click-target)
- [ ] 3 Highlight map → "Click precincts to paint them into District 2." (pause, paint-count)
- [ ] 4 Highlight Undo → "Undo steps back." (next)
- [ ] 5 Highlight Submit → "Submit when the county is split in two." (submit; ends)

## Test Coverage

- [ ] e2e: overlay shows on guided tutorial-001 load (panel matches step 1); no overlay on a
      non-guided scenario.
- [ ] e2e: step advances on District 2 click; paint-count advances after painting.
- [ ] e2e: Skip dismisses overlay; not re-shown after (localStorage); `?resetTutorial=1` re-shows.
- [ ] e2e: during a paused step, painting elsewhere has no effect.

## References

- DESIGN-012 — overlay UX spec (step model, activation, T1 script). Sign off first.
- GAME-097 (resolved) — paint-only T1 + flags this builds on.
- `game/web/src/main.ts` (editor entry, district buttons, undo/submit), `game/web/index.html`,
  `game/web/styles.css`.
- GAME-077 — tutorial-002 reveal script (reuses this engine).
