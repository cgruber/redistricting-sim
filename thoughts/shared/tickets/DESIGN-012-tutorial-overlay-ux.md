---
id: DESIGN-012
title: Tutorial overlay UX — guided walkthrough engine (step model, activation, scripts)
area: design, UX, tutorial
status: open
created: 2026-05-18
---

## Summary

Design the guided-overlay engine that walks a new player through the game UI during the
tutorials. The overlay shows a contextual instruction panel over the map, highlights the
relevant UI element, optionally pauses input, can **reveal** a control that started hidden,
and advances through a scripted sequence. This doc fixes the step model, the activation
convention, highlight/pause/skip semantics, and the **step scripts for the full 4-tutorial
arc** (T1 Core Loop · T2 A Legal Map · T3 Reading the Vote · T4 Capstone) — the contract
GAME-076 (engine + T1), GAME-077 (T2), GAME-098 (T3), and GAME-099 (T4) implement against.

**This is a full revision (2026-06-24).** The original spec predated the toolbar refactor
and the tutorial redesign: it targeted removed header buttons (`#btn-view-toggle`,
`#btn-county-borders`) and walked the player through the validity panel / lean / county
views. Those no longer apply — tutorial-001 is now **paint-only** (no view toolbar, no
validity/results panels; see GAME-097), and the view lesson moved to tutorial-002.

See plan: `thoughts/shared/plans/2026-06-24-tutorial-redesign-pipeline-migration.md`.

## Activation — `guided: true` scenario flag

- A scenario opts into the walkthrough with **`guided: true`** in its spec (plumbed
  spec → assembler → scenario → loader, like `hide_view_toolbar`). The engine runs the
  overlay only for guided scenarios that have a registered step script.
- Non-guided scenarios show no overlay and pay no cost.
- Skip/persist: a "Skip tutorial" control is always visible while the overlay runs.
  Completing or skipping sets `localStorage["tutorial-<scenarioId>-complete"]`; the overlay
  is not re-shown after that (courtesy skip on replay). `?resetTutorial=1` clears the flags.

## Step data model

```typescript
interface TutorialStep {
  text: string;                      // instruction copy shown in the panel
  highlight?: string;                // CSS selector to ring + focus attention on
  reveal?: string;                   // CSS selector to UN-HIDE before highlighting (see below)
  pauseInput?: boolean;              // block all input except the advance target (default false)
  advance:
    | { on: "click-target" }         // advance when the highlighted element is clicked
    | { on: "any-map-click" }        // advance on any precinct click
    | { on: "paint-count"; n: number }   // advance once ≥ n precincts have been (re)painted
    | { on: "submit" }               // advance when the map is submitted (terminal)
    | { on: "auto"; ms: number }     // advance after a delay
    | { on: "next" };                // advance on an explicit "Next" button in the panel
}
// A script is an ordered TutorialStep[] registered by scenario id.
```

## Reveal-target action (drives tutorial-002's "unlock the views")

- The engine collects every `reveal` selector across a script and **hides those controls on
  load** (non-destructive: a `tutorial-hidden` class / `display:none`). Each control is
  un-hidden when its step fires. So a script that reveals `#filter-lean`, `#filter-county`,
  `#filter-city` makes the view toolbar open showing **only Districts**, then surfaces each
  view as it's taught.
- Reveal is **tutorial-local**: in non-guided scenarios nothing is hidden — all views are
  always available (the locked "reveal within the tutorial only" decision). No cross-scenario
  gating.
- Note this is distinct from `hide_view_toolbar` (GAME-097), which hides the *whole* toolbar
  for paint-only T1. T2 sets `hide_view_toolbar: false` and uses `reveal` per control.

## Highlight & input-pause mechanics

- **Highlight:** target gets a `tutorial-highlight` class (glowing ring); the rest get
  `tutorial-dimmed` (reduced opacity). Works for: a button id, the `#map-svg` hex area, a
  specific `.district-btn`. Purely additive CSS — never alters behavior.
- **Stable hooks:** the district paint buttons are dynamic `.district-btn` with no per-id;
  GAME-076 must add a stable hook (e.g. `data-district="2"`) so steps can target "District 2".
- **Input pause:** when `pauseInput`, all map painting and buttons are inert except the
  advance target (`pointer-events:none` + `not-allowed` cursor; blocked clicks silently
  ignored). **Escape and Skip stay active regardless.**
- **Panel:** instruction panel sits over the map (upper area), semi-transparent dark
  background, ~240px wide; shifts to avoid covering the highlighted element.

## tutorial-001 step script — paint-only welcome (the core loop)

T1 is hide_view_toolbar + hide_election_results + district_count-only. The script teaches
*only* select → paint → submit. (Selectors: `[data-district="2"]` = District 2 paint button,
`#map-svg` = map, `#btn-undo`, `#btn-submit`.)

| # | Text (gist) | highlight | pause | advance |
|---|-------------|-----------|-------|---------|
| 1 | "Welcome. This whole county is District 1 — your job is to split it into two." | — | no | next |
| 2 | "Pick **District 2** from the painter on the left." | `[data-district="2"]` | yes | click-target |
| 3 | "Now click precincts to paint them into District 2." | `#map-svg` | yes | paint-count n≈5 |
| 4 | "Changed your mind? **Undo** steps back." | `#btn-undo` | no | next |
| 5 | "When the county is split into two districts, **Submit**." | `#btn-submit` | no | submit (ends) |

No view/lean/county/validity steps — none exist in T1.

## tutorial-002 step script — "A Legal Map" (contiguity + balanced population)

T2 introduces the structural rules and the **validity panel**. `guided: true`,
`hide_election_results: true`, `hide_view_toolbar: true` — still **pre-electoral**, no views;
the validity panel shows because T2 *enforces* balance + contiguity. Gates on `district_count`
+ `population_balance` + contiguity. Slightly bigger map than T1.

| # | Text (gist) | highlight | pause | advance |
|---|-------------|-----------|-------|---------|
| 1 | "Bigger map — and now there are rules. A *legal* map needs two things: districts roughly equal in population, and each one a single connected piece." | — | no | next |
| 2 | "Paint your districts like before." | painter + `#map-svg` | no | paint-count |
| 3 | "Watch the **Map Validity** panel — it flags a district that's too big, too small, or split in two." | `#validity-container` | no | next |
| 4 | "Even out the populations and keep each district connected until the panel's all green." | `#validity-container` | no | next |
| 5 | "Legal map? **Submit**." | `#btn-submit` | no | submit (ends) |

The validity panel (`#validity-container`) is the star: T2 is where balance + contiguity
become taught, gated constraints (in T1 they were absent — no untaught failure modes).

## tutorial-003 step script — "Reading the Vote" (lean + election result, paired) + views

T3 is the **first electoral layer**. `guided: true`, `hide_election_results: false`,
`hide_view_toolbar: false`. Terrain (river/coast), partisan lean (an east/west split),
counties + an urban core. The **reveal targets** are the election-result panel
(`#results-heading`, `#results-container`) and the view controls `#filter-lean`,
`#filter-county`, `#filter-city` — all start hidden; **lean + the result are revealed
together** (the causal pair).

| # | Text (gist) | reveal | highlight | pause | advance |
|---|-------------|--------|-----------|-------|---------|
| 1 | "New map with some geography — a river, a coastline. Scenery; districts can cross them." | — | river/coast | no | next |
| 2 | "Until now every voter was the same. They're not. **Lean** colors each precinct by who it favors — and this is what that produces: the **election result**, district by district." | `#filter-lean` + `#results-heading` + `#results-container` | `#filter-lean` + `#results-container` | no | next |
| 3 | "Repaint a district and watch the result move. The lines decide who wins." | — | `#results-container` | no | paint-count |
| 4 | "**County** borders show the old administrative lines." | `#filter-county` | `#filter-county` | yes | click-target |
| 5 | "**City limits** show where the city is." | `#filter-city` | `#filter-city` | yes | click-target |
| 6 | "That's the whole picture. Draw your districts and submit." | — | painter + `#btn-submit` | no | submit (ends) |

Lean + the election result surface in the **same step** (2). County/city follow as
map-reading context. Objective stays mechanical (gates on `district_count`): the result is
shown to *read*, not yet to exploit — strategy is the capstone and the real scenarios.

## tutorial-004 — "Capstone" (script TBD, GAME-099)

Full map, every tool available from the start (nothing hidden, no `reveal`). A light script
orients ("everything you've learned, one map"), then leaves the player to it — the bridge to
the real electoral scenarios. Detailed script authored when reached.

## Extensibility — introducing future views

The `reveal` + highlight step is the **standard hook for introducing any view/overlay** to
the player. Several views are planned but unbuilt (population dot-density — DESIGN-005/006;
demographic dot-map — DESIGN-007; and others). Convention: **when a new view ships as a
View-toolbar entry, its implementation ticket includes an AC to add a `reveal`/highlight step
introducing it** — to tutorial-003 ("Reading the Vote") if it's a map-reading view, or the
capstone, as fits. This keeps the guided tutorial in sync with the toolbar as it grows; a new
view that never gets a tutorial step is an incomplete view.

## Open design questions (resolve in this ticket, before GAME-076)

- [ ] Panel exact placement + anti-obstruction rule (which corner; how it shifts).
- [ ] `paint-count` threshold for T1 step 3 (≈5? or "any precinct in D2"?).
- [ ] Does step 1 auto-advance or require a "Next" click? (script uses explicit `next`).
- [ ] Skip affordance copy + placement; confirm `tutorial-<id>-complete` key + reset param.

## Goals / Acceptance Criteria

- [ ] Step data model finalized (above) incl. `reveal` + `advance` variants.
- [ ] `guided: true` activation convention specified (flag, plumbing, skip/persist).
- [ ] Highlight / dim / input-pause semantics specified against the current UI.
- [ ] Reveal-target action specified (tutorial-local; collect-and-hide-on-load).
- [ ] tutorial-001 "Core Loop" paint script signed off (5 steps).
- [ ] tutorial-002 "A Legal Map" script signed off (5 steps; validity panel is the star).
- [ ] tutorial-003 "Reading the Vote" reveal script signed off (lean + result paired in one step).
- [ ] tutorial-004 "Capstone" outline (full script authored in GAME-099).
- [ ] Stable selector hook for district buttons noted for GAME-076.

## References

- GAME-076 — engine + tutorial-001 script (implements this).
- GAME-077 — tutorial-002 reveal script (reuses the engine).
- GAME-097 (resolved) — paint-only T1 chrome + flags (`hide_view_toolbar`, etc.) this builds on.
- `game/web/index.html` (control ids), `game/web/src/render/panels.ts` (`.district-btn`),
  `game/web/src/main.ts` (toolbar/hide wiring), `game/web/styles.css`.
