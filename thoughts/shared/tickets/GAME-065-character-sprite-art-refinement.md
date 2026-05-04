---
id: GAME-065
title: Character sprite art refinement — replace placeholder SVGs with quality art
area: game, art, content
status: open
created: 2026-05-04
---

## Summary

Replace the placeholder SVG character sprites (GAME-060) with quality art. The
current AI-generated SVGs are functional and structurally correct (right viewBox,
poses, animation, file naming) but aesthetically flat — they don't have the visual
charm the result screen needs. This ticket covers one dedicated art pass to produce
sprites worth shipping.

The existing SVGs serve as accurate pose/layout references; the new art should
match the same 200×200 viewBox, file naming, and idle-bob animation convention so
GAME-062 wiring requires no changes.

## Current State

20 SVG files exist at `game/web/assets/characters/{type}/{state}.svg` — correct
structure, correct poses, but bland flat shapes that don't read as characters.
GAME-062 (reaction system) has not been implemented yet, so this is the right
moment for an art pass before wiring begins.

## Goals / Acceptance Criteria

- [ ] All 20 SVG files replaced with visually improved character art
      (5 types × 4 states: three-star / two-star / one-star / zero-star)
- [ ] Each type has a recognisable silhouette at 160 px display size
- [ ] Same type reads as the same character across all 4 states
      (pose + expression change; costume / silhouette stays consistent)
- [ ] Idle-bob animation (`@keyframes idle-bob`, 0.6–1.0 s loopable) present
      in every file — same convention as current placeholders
- [ ] `viewBox="0 0 200 200"`, transparent background — no changes to
      GAME-062 wiring needed
- [ ] File sizes < 15 KB per SVG
- [ ] ALT-TEXT.md updated to match revised designs if descriptions change
- [ ] Visual review sign-off before merge (open in sprite-review page)

## Approach options

1. **Dedicated image-gen model → SVG trace**: Generate reference character art
   in Grok, DALL-E, or Midjourney using the DESIGN-009 consistency spec as
   prompt; use as visual targets; hand-author cleaner SVGs against the references.
2. **Pixel art**: Produce 40×40 or 64×64 pixel art sprites (Aseprite or AI
   pixel-art tool); ship as PNG with `image-rendering: pixelated` CSS scaling;
   requires GAME-062 to load `<img>` instead of inline SVG — assess before starting.
3. **Iterative SVG prompt engineering**: Use a model with stronger visual SVG
   output (Grok, GPT-4o) to generate SVG directly, using DESIGN-009 §CONSISTENCY
   verbatim in every prompt.

Option 1 or 3 preserves the SVG pipeline and requires no GAME-062 changes.
Option 2 is a format switch — decide before starting and update DESIGN-009 if chosen.

## References

- `thoughts/shared/tickets/DESIGN-009-character-reaction-visual-style.md` — style spec
  (§CONSISTENCY section must be embedded in every art-gen prompt)
- `game/web/assets/characters/` — current placeholder SVGs
- `game/web/assets/characters/ALT-TEXT.md` — accessibility descriptions
- `thoughts/shared/tickets/GAME-062-character-reaction-system.md` — downstream consumer
- Sprite review page: regenerate on demand from the grid template in the Visual
  review AC above (dark background, 5×4 grid, idle-bob animation, file:/// paths
  to `game/web/assets/characters/{type}/{state}.svg`)
