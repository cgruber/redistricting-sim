---
id: DESIGN-009
title: Character reaction visual style — result screen art direction
area: design, UX, art
status: open
created: 2026-05-02
github_issue: 197
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

- [x] Art style decided: inline SVG + CSS animation (preferred) or pixel art sprite
      sheet — with rationale documented
- [x] Open questions resolved: pixel art vs flat SVG; scenario-006 two-character
      display; tutorial scenarios; instigator model (no player avatar); 20 files
      (one per state); consistency spec for AI art generation; format re-skinning
      flexibility; split-screen as general capability for asymmetric party outcomes
- [x] Character roster finalized: 5 instigator types; each scenario mapped to
      its instigator type; custom art design space reserved (no impl)
- [x] Animation states defined: instigator types — 3-star/2-star/1-star/0-star
      (4 states each); instigator plays last after per-criterion animations
- [x] Reference mockups or style guide produced (AI-generated SVG drafts acceptable)
      NOTE: visual style guide documented; actual SVG drafts deferred to GAME-060
- [x] Audio tone per character type described — input for GAME-061
- [x] Format decision documented: dimensions, file format, color palette

## References

- `thoughts/shared/research/2026-05-02-design-009-character-reaction-visual-style.md`
  — research doc with roster, style options, and recommendation
- `game/scenarios/*.json` — `narrative.character` field in each scenario
- `thoughts/shared/tickets/GAME-060-character-sprite-assets.md` — depends on this
- `thoughts/shared/tickets/GAME-061-audio-clips.md` — depends on this
- `thoughts/shared/tickets/GAME-062-character-reaction-system.md` — depends on this
