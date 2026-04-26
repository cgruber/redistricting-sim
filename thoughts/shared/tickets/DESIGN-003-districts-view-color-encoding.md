---
id: DESIGN-003
title: Districts view color encoding — population gradient design decision
area: design, UX
status: open
created: 2026-04-25
---

## Summary

The current Districts view applies a population-density gradient on top of
district palette colors: high-population precincts are darker, low-population
precincts are lighter (HSL lightness adjusted by `normPop`). The intent was to
show population distribution within a district at a glance. In practice, Sprint 1
demo feedback was that the map reads more as a **population heat map** than a
district map — the gradient dominates the district-colour signal.

A design decision is needed: should Districts view show population density, and
if so, how prominently? The answer shapes the color encoding approach for Sprint 2.

## Current Implementation

`hexFill()` in `game/web/src/render/mapRenderer.ts`:
```typescript
const c = d3.hsl(base);
c.l = 0.55 - normPop * 0.30;  // l ranges 0.25 (max pop) → 0.55 (min pop)
return c.formatHex();
```

`hexOpacity()` returns `0.75` for assigned precincts.

The 0.30 lightness range is wide enough to visually dominate at low precinct counts.

## Goals / Acceptance Criteria

- [ ] Decide on encoding strategy (options below) — document choice
- [ ] Implement chosen strategy in `hexFill()` / `hexOpacity()`
- [ ] Confirm with a quick visual test that districts are clearly legible at
  30 precincts and (projected) 100+ precincts

## Options

**A — Flat district color, no population encoding** (recommended for v1):
- All precincts in a district get the same base color.
- Population is only visible in the hover tooltip and results panel.
- Cleanest district-boundary readability.

**B — Subtle opacity variation** (current but toned down):
- Reduce the lightness range from 0.30 to something like 0.10–0.15.
- Keeps a hint of population density without overwhelming district identity.

**C — Dedicated population view** (deferred to later sprint):
- Add a third view mode ("Population") in addition to Districts and Lean.
- Districts view becomes flat; population info is opt-in.
- Most flexible, but adds UI complexity.

**D — Stipple / dot density overlay** (ambitious):
- Small dots scaled by population density over flat district fills.
- High information density but requires extra rendering work.

Option A is recommended for Sprint 2; defer population density to a later sprint
as an opt-in overlay (option C path).

## Notes

- This intersects with the accessibility ticket (GAME-008): a flat palette is
  easier to make color-blind safe than a gradient palette.
- The Partisan Lean view is unaffected — it already uses a clean RdBu encoding.

## References

- `game/web/src/render/mapRenderer.ts` — `hexFill()` and `hexOpacity()`
- `game/web/src/model/types.ts` — `DISTRICT_COLORS`
- GAME-008 (accessibility) — color palette decisions should be co-ordinated
