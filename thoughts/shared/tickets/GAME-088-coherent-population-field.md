---
id: GAME-088
title: Coherent population field — spatial structure, contrast, normalize-to-total
area: game, tooling
status: open
created: 2026-06-22
---

## Summary

Rework the population stage so generated density forms coherent spatial gradients instead
of salt-and-pepper noise. Observed in scenario-002 playtest: a tight central cluster with
unexpectedly light precincts sitting next to heavy ones. Root cause is independent
per-precinct uniform jitter (`±variance`) with no coherent-noise, contrast, or
normalization layer — the pipeline took the "simplification off-ramp" documented in the
prior-art research.

## Current State

`game/web/src/pipeline/population-stage.ts` computes
`base × suitability + settlement_bump + jitter × suitability`, where `jitter` is
`prng.nextInt(-variance, variance)` per precinct — uncorrelated between neighbours.
Settlement bumps are tight Gaussians (σ = radius/2). Only `scenario-002` exercises this.

## Goals / Acceptance Criteria

- [ ] Replace independent jitter with a spatially-coherent field (neighbour-correlated):
      minimum viable = 1–2 neighbour-averaging smoothing passes on the seeded jitter;
      upgrade to a value-noise lattice if smoothing isn't organic enough
- [ ] Optional spec-driven radial/gradient layer (monocentric dense-core → rural-fringe)
- [ ] Contrast step `pow(normalized, k)` (k≈2 default) to sharpen centers / push low→0
- [ ] Normalize final field to a spec target total (default = preserve current scenario
      total) — this isolates shape change from magnitude change
- [ ] Terrain suitability (Layer 1) and named settlements still compose with the new layers
- [ ] All new behaviour is spec-driven with documented defaults; defaults keep output
      close enough that scenario-002's e2e solve test still passes (or update deliberately)

## Test Coverage

- [ ] Unit tests for each new layer (smoothing, gradient, contrast, normalization) in
      `population-stage_test.ts`
- [ ] Regenerate `scenario-002.json`; e2e solve test stays green (or deliberately updated)
- [ ] Manual: scenario-002 density reads as a coherent gradient, no salt-and-pepper

## References

- Plan: `thoughts/shared/plans/2026-06-22-generation-quality-overhaul.md`
- Prior art: `thoughts/shared/research/2026-05-31-population-distribution-prior-art.md`
  (fBm + `pow` contrast pipeline; the off-ramp this ticket walks back)
- `game/web/src/pipeline/population-stage.ts`, `prng.ts`
- `game/scenarios/scenario-002.spec.yaml`
- Follows GAME-087 (the two-layer terrain-aware stage this extends)
