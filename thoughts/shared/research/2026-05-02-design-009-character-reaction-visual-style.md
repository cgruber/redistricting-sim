# DESIGN-009: Character Reaction Visual Style Research

**Date:** 2026-05-02  
**Researcher:** Claude (Sonnet 4.6)  
**Topic:** Art style, character roster, and animation approach for result screen reactions  
**Status:** draft — open questions to be resolved during DESIGN-009 ticket work

---

## Summary

Every scenario casts the player as "You" in a named role, but the *reactions* on the
result screen should come from the stakeholders who hired or empowered you — the
partisan boss, the judge, the reform commissioner. The result screen is the right
moment to make them appear: they see the map you drew and respond.

This document surveys visual style options, derives a character type taxonomy from
the current scenario set, and makes a format recommendation.

---

## Character Roster

All ten scenarios map to five distinct character types.

| Type | Scenarios | Character who reacts | Pass | Fail |
|---|---|---|---|---|
| Partisan Boss | 002, 003, 004 (Ken); 009 (Cat) | Party boss who hired you | Fist pump, flag wave | Head in hands |
| Legal Authority | 005 | Federal judge | Gavel bang (approval), scales balanced | Gavel bang (reject), scales tipped |
| Bipartisan Broker | 006 | Both party bosses (one each side) | Handshake | Crossed arms |
| Reform Arbiter | 007, 008 | Reform commission | Thumbs up, balanced scales | Thumbs down, head shake |
| Neutral Admin | tutorial-001, tutorial-002 | Supervisor | Checkmark nod | Shrug |

Scenario-006 is a special case: two characters appear simultaneously (one per party).
The party whose interests were served cheers; the other does not.

---

## Visual Style Options

### Option A — Pure CSS characters
Ruled out. Cannot convey distinct character types or "cute" personality.

### Option B — Inline SVG + CSS animation (recommended)
Each character is a self-contained SVG with pass/fail states toggled via CSS class.
Animated with `@keyframes`. Resolution-independent, hand-authorable, < 8 KB per
character, no library needed. AI-generated SVG (Claude as primary, other multimodal
models as fallback) is the planned production method.

### Option C — Pixel art sprite sheets
Viable alternative. Retro charm, Aseprite workflow, small file sizes. Requires
integer CSS scaling (`image-rendering: pixelated`). Higher authoring overhead than
SVG for AI generation.

### Option D — Lottie
Ruled out. 40 KB library overhead, requires AE tooling, overkill for 5 characters.

### Option E — CSS + emoji
Ruled out. This is the existing GAME-052 placeholder; not the goal.

---

## Recommendation

**Format:** Inline SVG + CSS `.pass` / `.fail` class toggle + `@keyframes`. 5 SVG files.

**Style:** Flat, minimal, 2–3 colors per character. Silhouette-readable at 160–200 px.
Political-cartoon / board-game-token aesthetic.

**Palette:** each type gets a distinct accent against the dark game background:
- Partisan Boss: party gold / red
- Legal Authority: slate blue
- Bipartisan Broker: split half-and-half
- Reform Arbiter: teal / green
- Neutral Admin: muted grey-blue

**Animation:** 0.6–1.0 s loopable; suppressed by `prefers-reduced-motion`.

**Audio:** preloaded MP3 + OGG. 10 clips (5 types × pass/fail). Source priority:
(1) CC0 from freesound.org / pixabay, (2) AI-generated audio, (3) CC-BY with
attribution. Target < 100 KB per clip.

---

## Open Questions (to be resolved in DESIGN-009 ticket work)

1. **Pixel art vs flat SVG?** Flat SVG is more consistent with the current dark-HUD
   strategy aesthetic. Pixel art adds retro-playful feel. Decision pending.

2. **Scenario-006 two-character case:** show both bosses simultaneously (split screen)
   or sequentially? Simultaneous is more expressive but doubles layout complexity.

3. **Tutorial character:** lowest emotional charge. Full neutral-admin reaction, or
   skip the character animation for tutorials?

---

## References

- `game/scenarios/*.json` — `narrative.character` field (all 10 scenarios)
- `thoughts/shared/tickets/DESIGN-009-character-reaction-visual-style.md`
- `thoughts/shared/tickets/GAME-060-character-sprite-assets.md`
- `thoughts/shared/tickets/GAME-061-audio-clips.md`
- `thoughts/shared/tickets/GAME-062-character-reaction-system.md`
- `thoughts/shared/vision/game-vision.compressed.md` — visual aesthetic
