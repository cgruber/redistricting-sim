---
id: DESIGN-009
title: Character reaction visual style — result screen art direction
area: design, UX, art
status: open
created: 2026-05-02
---

## Summary

Define the visual style, format, and character roster for animated character reactions
on the result screen. This is the gate ticket for GAME-060 (sprites), GAME-061
(audio), and GAME-062 (implementation). No code ships until this is settled.

## Current State

The result screen shows an emoji placeholder (🎉/💔) added in GAME-052 as a
stand-in. The scenario format already includes `narrative.character` (name, role,
motivation) which gives us the character roster. No art style has been decided.

## Goals / Acceptance Criteria

- [ ] Art style decided: inline SVG + CSS animation (preferred) or pixel art sprite
      sheet — with rationale documented
- [ ] Open questions resolved: pixel art vs flat SVG; scenario-006 two-character
      simultaneous vs sequential display; tutorial scenarios — full reaction or skip
- [ ] Character roster finalized: enumerate all distinct character types across
      scenarios and map each scenario to its character type
- [ ] Pass/fail animation states defined per character type
- [ ] Reference mockups or style guide produced (AI-generated SVG drafts acceptable)
- [ ] Audio tone per character type described — input for GAME-061
- [ ] Format decision documented: dimensions, file format, color palette

## References

- `thoughts/shared/research/2026-05-02-design-009-character-reaction-visual-style.md`
  — research doc with roster, style options, and recommendation
- `game/scenarios/*.json` — `narrative.character` field in each scenario
- `thoughts/shared/tickets/GAME-060-character-sprite-assets.md` — depends on this
- `thoughts/shared/tickets/GAME-061-audio-clips.md` — depends on this
- `thoughts/shared/tickets/GAME-062-character-reaction-system.md` — depends on this
