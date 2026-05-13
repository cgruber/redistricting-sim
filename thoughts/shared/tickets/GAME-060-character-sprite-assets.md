---
id: GAME-060
title: Character sprite and animation assets for result screen reactions
area: game, art, content
status: open
created: 2026-05-02
github_issue: 201
last_updated: 2026-05-13
---

## Summary

Produce the PNG sprite sheets for the four character types not yet built:
`commissioner`, `party`, `judge`, `legislator`. The `governor` sheet is already
complete and in use (GAME-069). All four sheets follow the same horizontal-strip
format: [neutral | approve | disapprove], 200 px row height, fixed-width poses.
Character types and visual design are defined in DESIGN-011.

The bipartisan-broker variants (3 demographic pairs × 3 evaluation states = 9 images)
are defined in `tools/sprite-spec.json` and are generated separately via
`gen-assets.main.kts`. They are consumed by scenario-006 as an instigator,
not as per-criterion reaction characters.

## Current State

- `governor` sprite sheet: complete — `game/assets/characters/character-governor.png`
- `commissioner`, `party`, `judge`, `legislator`: not yet produced
- Old SVG placeholder files exist at `game/web/assets/characters/{type}/{state}.svg`
  from prior work; these are superseded by the PNG sprite sheet approach and can
  be cleaned up in this ticket or GAME-065

## Goals / Acceptance Criteria

- [ ] `commissioner` PNG sprite sheet produced per DESIGN-011 spec
      (neutral / approve / disapprove poses; clipboard/folder prop)
- [ ] `party` PNG sprite sheet produced per DESIGN-011 spec
      (small cluster of figures with flags; neutral color body, party-tintable flags)
- [ ] `judge` PNG sprite sheet produced per DESIGN-011 spec
      (black-robed single figure; gavel prop; neutral / nod approve / dismissive disapprove)
- [ ] `legislator` PNG sprite sheet produced per DESIGN-011 spec
      (treatment decided: building/gavel/assembly; neutral / approve / disapprove)
- [ ] All sheets follow governor format: single horizontal strip, 200 px row height,
      equal-width poses, documented pixel offsets
- [ ] All sheets committed to `game/assets/characters/character-<key>.png`
- [ ] DESIGN-011 roster table updated with any design-phase changes
- [ ] Old SVG placeholder files removed or noted as superseded

## Test Coverage

- [ ] Visual review: each sheet opened on dark background at display size (≈100–120 px height)
      and all three poses read clearly as the same character in different states

## References

- `thoughts/shared/tickets/DESIGN-011-per-criterion-character-roster.md` — **blocks this** (art spec)
- `game/assets/characters/character-governor.png` — format reference
- `tools/sprite-spec.json` — broker variants (separate art, scenario-006 instigator)
- `tools/gen-assets.main.kts` — image generation pipeline
- `thoughts/shared/tickets/GAME-062-character-reaction-system.md` — downstream consumer
