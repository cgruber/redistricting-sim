---
id: GAME-060
title: Character sprite and animation assets for result screen reactions
area: game, art, content
status: open
created: 2026-05-02
---

## Summary

Create the character art and animation assets for result screen reactions — one set
per character type (partisan boss, legal authority, bipartisan broker, reform arbiter,
neutral admin) with pass and fail animation states. Format and style defined by
DESIGN-009. Art will be AI-generated (Claude SVG generation as primary approach;
Grok/other multimodal models as fallback if quality is insufficient).

## Current State

No character art exists. The result screen shows a 🎉/💔 emoji placeholder (GAME-052).

## Goals / Acceptance Criteria

- [ ] One asset per character type × 2 states (pass / fail) — 10 assets total
- [ ] Assets match the format decided in DESIGN-009 (SVG preferred)
- [ ] Pass state: character expresses approval (thumbs up, cheering, etc.)
- [ ] Fail state: character expresses disapproval (thumbs down, booing, etc.)
- [ ] File sizes appropriate for browser delivery (target: < 20 KB per SVG)
- [ ] Assets placed in `game/web/assets/characters/` (see GAME-063)
- [ ] Accessible alt-text description for each character/state

## References

- `thoughts/shared/tickets/DESIGN-009-character-reaction-visual-style.md` — **blocks this**
- `thoughts/shared/tickets/GAME-063-asset-pipeline.md` — asset directory must exist first
- `thoughts/shared/tickets/GAME-062-character-reaction-system.md` — consumes these assets
