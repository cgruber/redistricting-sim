---
id: GAME-027
title: Hex-of-hexes map shape for new scenarios
area: game, content
status: resolved
created: 2026-04-27
---

## Summary

Current scenario generators produce rectangular `q × r` grids which render as
rhomboid/parallelogram shapes in hex axial coordinates — visually wrong for a
game map. New scenarios (007+) should use a hex-of-hexes region: a true hexagonal
arrangement of hexes centered at the origin. This is purely a generator change;
no TypeScript or renderer changes are needed.

Backporting to scenarios 002–006 is a separate ticket (GAME-028).

## Current State

Scenarios 002–006 use rectangular nested loops (`for r in 0..NUM_R, for q in 0..NUM_Q`)
producing parallelogram-shaped maps. The hex axial renderer handles arbitrary q,r
positions, including negatives, so hex-of-hexes coordinates work without engine changes.

## Hex-of-hexes formula

For radius R, valid positions satisfy: `|q| ≤ R && |r| ≤ R && |q+r| ≤ R`
Precinct count = `3R² + 3R + 1`

| R | Precincts | Districts of 25 | Districts of 24 |
|---|---|---|---|
| 5 | 91 | — | — |
| 6 | 127 | 5 (×25, +2 spare) | 5 (×25-26) |
| 7 | 169 | — | 7 (×24) |

For 5-district scenarios: use R=6 (127 hexes). Districts get ~25-26 precincts each;
population balance is by population totals, not precinct count, so uneven splits fine.

Generator pattern:
```kotlin
val R = 6
val hexes = buildList {
    for (q in -R..R) {
        val rMin = maxOf(-R, -q - R)
        val rMax = minOf(R, -q + R)
        for (r in rMin..rMax) { add(q to r) }
    }
}.sortedWith(compareBy({ it.second }, { it.first }))
```

Coordinates are centered at (0,0) — natural axial, including negatives.

## Goals / Acceptance Criteria

- [x] Scenario-007 generator uses hex-of-hexes (R=6, 127 hexes)
- [x] Scenario-008 generator uses hex-of-hexes (R=6, 127 hexes)
- [x] Scenario-009 generator uses hex-of-hexes (R=6, 127 hexes)
- [x] All three scenarios load without validation errors
- [x] All three scenarios render as recognizable hexagonal map shapes
- [x] e2e tests pass for all three

## Test Coverage

- [x] e2e: each scenario renders expected precinct count (127)
- [x] e2e: winnability tests use hex-coordinate-aware precinct index calculations

## References

- GAME-028 — backport hex shape to scenarios 002–006
- DESIGN-008 — geographic features (lakes, mountains) as decorative non-precinct tiles
- `thoughts/shared/decisions/2026-04-27-game-name.md` — naming context
