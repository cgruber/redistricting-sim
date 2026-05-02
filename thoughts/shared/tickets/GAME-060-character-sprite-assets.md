---
id: GAME-060
title: Character sprite and animation assets for result screen reactions
area: game, art, content
status: open
created: 2026-05-02
github_issue: 201
---

## Summary

Create the instigator character art for result screen reactions — one SVG file per
instigator type × star-count state (5 types × 4 states = 20 files). The instigator
is the person who hired the player (party boss, judge, reform commissioner, etc.)
and reacts based on how well the player delivered, graded by star count (3/2/1/0).
Format and consistency spec defined by DESIGN-009. Art will be AI-generated (Claude
SVG as primary; Grok/other multimodal models as fallback).

## Current State

No character art exists. The result screen shows a 🎉/💔 emoji placeholder (GAME-052).
DESIGN-009 defines the full consistency spec — it MUST be read before generating any
art (embed the §CONSISTENCY section in every generation prompt).

## Goals / Acceptance Criteria

- [ ] 20 SVG files: 5 instigator types × 4 states (three-star/two-star/one-star/zero-star)
- [ ] File naming: `assets/characters/{type}/{state}.svg`
      types: partisan-boss, legal-authority, bipartisan-broker, reform-arbiter, neutral-admin
- [ ] All files use `viewBox="0 0 200 200"`, transparent background
- [ ] Character occupies center ~140×160 px; head ~y=30, feet ~y=190, centered horiz
- [ ] Flat fills, 2–3 colors per type, 2–3 px stroke, no gradients
- [ ] Each type has a visually distinct silhouette readable at 160 px
- [ ] Same type across 4 states: same character, only pose+expression changes
- [ ] State poses match DESIGN-009 spec (three-star=expansive celebratory; two-star=composed positive; one-star=reserved; zero-star=closed/disapproving)
- [ ] Subtle idle animation (bob/blink/breathing, 0.6–1.0 s loopable) in each SVG
- [ ] File sizes < 15 KB per SVG
- [ ] Assets placed in `game/web/assets/characters/{type}/` (GAME-063 pipeline must be merged first)
- [ ] Accessible alt-text description documented for each type/state combination

## References

- `thoughts/shared/tickets/DESIGN-009-character-reaction-visual-style.md` — **blocks this**
- `thoughts/shared/tickets/GAME-063-asset-pipeline.md` — asset directory must exist first
- `thoughts/shared/tickets/GAME-062-character-reaction-system.md` — consumes these assets
