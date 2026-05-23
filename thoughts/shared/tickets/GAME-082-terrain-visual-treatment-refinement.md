---
id: GAME-082
title: Terrain visual treatment refinement — thicker rivers, prominent coast/lakeside edges, foothill rendering
area: game, rendering, UX
status: open
created: 2026-05-19
github_issue: 247
---

## Summary

GAME-075 shipped terrain rendering per DESIGN-008's spec. Manual playthrough of scenario-010
revealed the visual treatment is too subtle: rivers at 2.5px / 70% opacity read as thin threads
rather than as geographic features. Coast and lakeside edges, while present, are similarly
quiet. Foothill rendering was deferred during GAME-075 and is now overdue.

This ticket is a focused visual-tuning pass over the terrain layer. No schema or simulation
changes — just bumping stroke weights, opacities, and possibly adding fills or hatches to make
terrain features read clearly at default zoom and at the partisan-lean view tint.

## Current State (as of GAME-086 merge)

`mapRenderer.ts` constants (all sized in pre-zoom map units):
- `RIVER_BASE_WIDTH = 9`, `RIVER_OPACITY = 0.9`, `stroke-linecap/linejoin: round` — done
- Coast/foothill/lakeside rendered as **filled intrusion shapes** (not edge strokes) — each bleeds the terrain tile colour into the adjacent precinct, with a white boundary curve and corner caps where two intrusions meet. Depth: coast=5px, foothill=6px, lake=5px.
- `RIVER_STROKE = "#4dd0e1"` — unified with lake fill colour (was `#38bdf8`)
- `has_internal_lake` / `INTERNAL_LAKE_OPACITY`: **removed** in GAME-085 (composable terrain schema cleanup). Internal-lake ellipses no longer exist.
- Terrain tile fills (sea `#3a7fc1`, lake `#4dd0e1`, mountain `#6b7280`) have no stroke — still the case.

## Goals / Acceptance Criteria

### Rivers

- [x] River stroke base width bumped — `RIVER_BASE_WIDTH = 9` (exceeds 5–7px target; reads clearly)
- [x] River opacity bumped to 0.9 (`RIVER_OPACITY = 0.9`)
- [x] `stroke-linecap: round` confirmed
- [x] `stroke-linejoin: round` applied

### Coast / lakeside / foothill edges

- [x] Coast rendered as filled intrusion shape bleeding sea colour into precinct (smooth profile, depth 5px) — PR #252 / #253
- [x] Lakeside rendered identically with lake colour (`#4dd0e1`) — GAME-086 / PR #253
- [x] Foothill rendered as filled intrusion (rugged profile, depth 6px) — GAME-082 / PR #252
- [x] Corner caps where two same-type intrusions meet at a shared corner — PR #252
- [x] White boundary curve along inner edge of each intrusion — PR #252
- [ ] Manual: verify intrusions read clearly in partisan-lean view (PuOr fill tint)

### Terrain tiles

- [ ] Optional: thin border around sea/lake/mountain tile fills (boundary against empty SVG background)
- [ ] Optional: mountain glyph 2–3 small triangles instead of single `△`
- [ ] Manual: sea glyph (`∿`) legibility at default zoom

### Internal lakes

- [x] N/A — `has_internal_lake` and internal-lake ellipse rendering removed entirely in GAME-085. Superseded by `lakeside` composable annotation.

### Cross-view consistency

- [ ] Manual: terrain treatment readable in both districts view and partisan-lean view
- [ ] Manual: terrain tiles + river do not visually compete with district boundary stroke

## Test Coverage

- [x] N/A — e2e: stroke widths not asserted directly; tested manually after dev deploy
- [x] e2e: `path.terrain-edge-mountain` count = 8 across foothill precincts in tutorial-003
- [x] e2e: `path.terrain-edge-lake` count = 6 (lake tile at (-1,1), 6 neighbours) in tutorial-003
- [x] e2e: `path.terrain-edge-sea` count = 9 in tutorial-003
- [x] Unit: adapter derives `coast`, `foothill`, `lakeside`, `riverside` independently
- [ ] Manual: load tutorial-003, eyeball at default zoom + max zoom — all terrain annotations read clearly
- [ ] Manual: switch to partisan-lean view — terrain still distinguishable

## Out of scope

- Animated water (deferred to "post-v1" per DESIGN-008)
- Pixel-accurate visual regression testing (no infra for it)
- New terrain types beyond sea/lake/mountain
- Schema or simulation changes

## References

- DESIGN-008 — original terrain spec (`thoughts/shared/tickets/DESIGN-008-geographic-features.md`)
- GAME-075 resolution (PRs #241–#245) — terrain implementation, ticket retired
- `game/web/src/render/mapRenderer.ts` — all rendering constants live in the `SvgMapRenderer` class
- Scenario-010 — the only scenario that currently exercises terrain features; will need an internal-lake scenario before that AC can be validated
- DESIGN-015 — information-density redesign (related but orthogonal — that's layout, this is rendering)
