---
id: GAME-123
title: Educational-scenario partisan realism — more contested pluralities
area: game, content
status: open
created: 2026-07-06
---

## Summary

The educational campaign scenarios (`scenario-002` … `scenario-009`) lean on
precincts that are near-locked safe *majorities*, so packing/cracking mostly
shuffles pre-decided blocs rather than forcing a real trade-off. Surfaced in the
2026-07-06 tutorial playtest: the maps are *fine for teaching the mechanic*, but a
more realistic scenario wants more genuine **contested pluralities** — precincts
where the outcome actually turns on where the lines fall.

The tutorials (`tutorial-001` … `tutorial-006`) stay deliberately simple; this is
about the post-tutorial *campaign* scenarios only.

## Current State

- The tutorial ladder is complete and legality-gated (GAME-121); outcomes are
  emergent, read off the live result panel.
- The campaign scenarios were tuned for winnability against fixed seat targets,
  which biased them toward safe per-precinct majorities.
- The demographics pipeline (`pipeline/demographics-stage.ts`, GAME-116 N-party +
  GAME-119 feature-anchored zones) can already express finer-grained leans — this is
  a content/tuning task, not a missing capability.

## Goals / acceptance criteria

- [ ] Audit `scenario-002` … `scenario-009` for the share of precincts that are
      lopsided majorities vs. genuinely contested pluralities.
- [ ] Retune demographics zones (and/or settlement placement) so a meaningful
      fraction of precincts are actually contestable — packing/cracking changes the
      seat outcome, not just the margin.
- [ ] Preserve each scenario's teaching intent and winnability (re-verify e2e).
- [ ] Tutorials left unchanged.

## References

- Playtest that surfaced this: 2026-07-06 tutorial-005 run.
- Content: `game/scenarios/scenario-00{2..9}.spec.yaml` + generated JSONs.
- Pipeline: `game/web/src/pipeline/demographics-stage.ts`.
- Related: GAME-116 (N-party demographics), GAME-119 (feature-anchored zones),
  GAME-058 (playability thresholds).
