---
id: GAME-087
title: Terrain-aware population stage — suitability scoring + settlement zones
area: GAME
status: resolved
created: 2026-05-31
---

## Summary

Replace the current flat-random population stage with one that produces realistic population
distribution based on terrain context and human settlement patterns. Precincts adjacent to
rivers and lakes attract higher population; mountain-adjacent precincts are sparse. An optional
settlement zone spec allows scenario designers to place named cities and towns with Gaussian
population falloff, anchored to terrain features or explicit coordinates. Scenarios without
any settlement spec still get plausible variation from automatic terrain suitability scoring.

Scope: changes to `population-stage.ts`, `spec-types.ts` (PopulationSpec extension), and
the matching tests. The pipeline orchestrator (`pipeline-runner.ts`) and other stages are
unaffected. Existing `scenario-002.spec.yaml` gets an updated population section.

See research doc: `thoughts/shared/research/2026-05-31-population-distribution-prior-art.md`

## Current State

`populateScenario` assigns `base + prng.nextInt(-variance, variance)` to every precinct
uniformly — no terrain influence, no settlement clustering. This produces implausible uniform
distributions (every precinct between 1350–1650 for a 1500±150 spec) and diverges from how
the old Kotlin generators worked.

## Design

### Layer 1: Terrain suitability (always on)

Each precinct gets a multiplier from its terrain context, derived from BFS distance fields
precomputed once over the partial scenario's terrain_tiles and river_edges:

| Context | Default multiplier |
|---|---|
| Lakeside (adjacent to lake tile) | 1.4× |
| Riverside (has a river_edge) | 1.3× |
| Coastal (adjacent to sea tile) | 0.9× |
| Mountain-adjacent | 0.5× |
| No terrain features | 1.0× |

Multiple features compose multiplicatively (e.g. a riverside + lakeside precinct = 1.3 × 1.4 ≈ 1.8×).
Multipliers are overridable in the spec via `terrain_weights`.

Final population without settlements:
`total_population = round(base × suitability × (1 + jitter))`
where jitter is a seeded ±variance/base fractional noise per precinct.

### Layer 2: Settlement zones (optional spec)

Named settlements as Gaussian population bumps. Each settlement has:
- `type`: `city` | `town` | `village` (affects default peak/radius if not specified)
- `anchor`: where to center — `lakeside` | `riverside` | `coastal` | `{q, r}` | `center` |
  cardinal directions (`north`, `northeast`, etc.)
- `peak`: population at center hex (absolute number)
- `radius`: hexes of Gaussian falloff (σ = radius / 2)
- `label`: optional display name (informational only)

Anchor resolution: for feature anchors (`lakeside`, `riverside`), pick the highest-suitability
matching precinct closest to the map center. For cardinal anchors, pick the matching-direction
precinct with highest suitability. For `{q, r}`, use the exact hex.

Settlement contribution per precinct: `peak × exp(−hex_dist² / (2σ²))`

Total population: terrain suitability base + sum of settlement contributions + jitter.
Normalize so the regional average stays near `base` if no explicit `total` is specified.

### Spec additions

```yaml
population:
  seed: 42
  base: 3000           # regional per-precinct mean
  variance: 300        # max jitter ±
  # optional overrides for terrain multipliers:
  terrain_weights:
    lakeside: 1.4
    riverside: 1.3
    coastal: 0.9
    mountain_adjacent: 0.5
  # optional settlements:
  settlements:
    - type: city
      label: Clearwater City
      anchor: lakeside        # or {q: 0, r: 0} or "center" or "northeast"
      peak: 18000
      radius: 2
    - type: town
      label: East Mills
      anchor: { q: 3, r: -1 }
      peak: 5000
      radius: 1
```

## Goals / Acceptance Criteria

- [x] AC1: Terrain suitability — precincts adjacent to lakes/rivers get higher population
      than flat precincts at the same base/seed; mountain-adjacent precincts get lower
- [x] AC2: Defaults — with no `terrain_weights` in spec, default multipliers apply
      (lakeside 1.4×, riverside 1.3×, coastal 0.9×, mountain-adj 0.5×)
- [x] AC3: Composability — precincts with multiple terrain features compose multiplicatively
- [x] AC4: Settlement zones — a settlement with `anchor: lakeside` and `peak: 10000 radius: 2`
      produces a Gaussian bump centered on the best lakeside precinct
- [x] AC5: Anchor types — all anchor types work: `lakeside`, `riverside`, `coastal`,
      `{q, r}`, `center`, cardinal directions
- [x] AC6: No settlements spec — terrain suitability + jitter alone produces plausible
      variation without throwing
- [x] AC7: Determinism — same spec+seed always produces the same output
- [x] AC8: Immutability — input PartialScenario is not mutated
- [x] AC9: Backwards compat — spec with only `seed/base/variance` (no terrain_weights,
      no settlements) still works; produces terrain-influenced output (not flat-random)
- [x] AC10: scenario-002 spec updated to use settlement zones appropriate for
      "Clearwater County" (a county-level urban/suburban mix)

## Test Coverage

- Unit: each terrain context type produces the expected relative population ordering
- Unit: settlement Gaussian bump — center precinct highest, falloff monotone with distance
- Unit: all anchor types resolve to a precinct without throwing
- Unit: determinism (same spec → identical output)
- Unit: immutability
- Unit: backwards compat with flat spec (no terrain_weights, no settlements)
- Integration: run against scenario-002 spec; validate output passes validateScenarioComplete

## References

- Research: `thoughts/shared/research/2026-05-31-population-distribution-prior-art.md`
- Prior art: Azgaar's Fantasy Map Generator (biome habitability × area pattern)
- Prior art: Red Blob Games fBm approach (suitability mask × noise, pow reshape)
- Prior art: Dookeran settlement scoring (BFS distance fields, calibrated weights)
- GAME-084: pipeline spec this stage is part of
