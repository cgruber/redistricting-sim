---
id: GAME-092
title: Scenario map editor — hand-tweak generated scenarios (rivers, terrain) in-browser
area: game, tooling, UX
status: open
created: 2026-06-23
---

## Summary

A visual editor for hand-tweaking pipeline-generated scenarios, so pedagogical
adjustments don't require editing JSON by hand. Motivated directly by placing a
river on scenario-002: the river is a list of `[precinctId, precinctId]` edge
pairs, which is tedious and error-prone to author by hand (had to trace a path,
map positions → ids, and inject via jq).

This is the tooling half of the project philosophy: the pipeline generates the
initial state; a human tweaks it for pedagogy. Right now the "tweak" step has no
UI.

## Goals / Acceptance Criteria (rough; design first)

- [ ] Click hex edges to add/remove **river** segments (cosmetic; `river_edges`).
- [ ] Place/remove **terrain tiles** (lake / sea / mountain) by clicking hexes.
- [ ] Optional: nudge per-precinct population / reassign county for fine-tuning.
- [ ] Export the edited scenario back to JSON (and ideally a diff vs the generated
      JSON, so manual tweaks are reviewable / re-appliable after regeneration).
- [ ] Reuses the existing SVG map renderer + hex-edge geometry.

## Open questions

- Edit the generated JSON directly, or maintain a "manual overlay" layered on top
  of regeneration (so regen + overlay = final, surviving generator changes)?
- Standalone debug route (e.g. `?edit`) vs a separate tool build.

## References

- Hand-edit precedent: scenario-002 river (20 `river_edges` injected via jq).
- `game/web/src/render/mapRenderer.ts` (edge geometry, river/terrain layers).
- Philosophy: pipeline = initial-state generator, hand-tweaked for pedagogy.
