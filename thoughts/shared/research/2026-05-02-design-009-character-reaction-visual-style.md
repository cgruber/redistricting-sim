# DESIGN-009: Character Reaction Visual Style Research

**Date:** 2026-05-02  
**Last updated:** 2026-05-02  
**Researcher:** Claude (Sonnet 4.6)  
**Topic:** Art style, character roster, and animation approach for result screen reactions  
**Status:** decisions complete — approved

---

## Summary

The player is a neutral consultant hired to draw a map. They have no stake in the
political outcome — it's "just a job." The person who *does* have a stake is the
instigator: the party boss, judge, reform commissioner, or supervisor who hired or
empowered the player. On the result screen, the instigator reacts to how well the
player delivered — graded by star count, not binary pass/fail.

The instigator's animation plays last, after all per-criterion reveal animations
finish, as the final emotional beat. Different scenarios pick from a curated roster
of instigator types. Design space is reserved for custom instigator art in future
custom-scenario tooling, but that functionality is not implemented now.

---

## Instigator Roster

Five instigator types cover all current scenarios. Future scenarios pick from this
roster (or, in future custom-scenario tooling, supply their own art).

| Type | Scenarios | Instigator | 3-star | 2-star | 1-star | 0-star |
|---|---|---|---|---|---|---|
| Partisan Boss | 002, 003, 004 (Ken); 009 (Cat) | Party boss who hired you | Fist pump, ecstatic | Satisfied nod, thumbs up | Grudging shrug, "close enough" | Head in hands, furious |
| Legal Authority | 005 | Federal judge | Gavel bang + scales balanced, beaming | Measured nod, gavel tap | Furrowed brow, reluctant approval | Gavel bang, scales tipped, rejection |
| Bipartisan Broker | 006 | Both party bosses (side-by-side) | Both bosses handshake, celebratory | Cautious handshake | One boss nods, other uncertain | Both bosses crossed arms, displeased |
| Reform Arbiter | 007, 008 | Reform commission | Bright thumbs up, balanced scales | Steady approval, nod | Reserved acknowledgment | Thumbs down, head shake |
| Neutral Admin | tutorial-001, tutorial-002 | Supervisor | Checkmark, warm smile | Approving nod | Mild nod, "acceptable" | Shrug, disappointed |

**State names** (CSS classes applied to the SVG): `three-star`, `two-star`, `one-star`, `zero-star`.

**Scenario-006 note:** The Bipartisan Broker type shows both party bosses simultaneously.
Both share the same outcome state (the criteria require safe seats for BOTH parties,
so there is no asymmetric outcome in current scenarios). Split-screen layout is
designed as a general capability for future scenarios with asymmetric party outcomes
— the implementation supports different state per panel.

**Custom scenario extensibility:** Leave design space in file layout and loading code
for a future custom-scenario author to supply their own instigator SVG. No
implementation required now; just avoid hard-coding the roster as a closed enum.

---

## Visual Style Options

### Option A — Pure CSS characters
Ruled out. Cannot convey distinct character types or personality.

### Option B — Inline SVG + CSS animation (chosen)
Each state is a separate SVG file. Pass/fail toggling replaced by 4-state class
system. Animated with `@keyframes`. Resolution-independent, AI-generable,
< 10 KB per file. No library needed.

### Option C — Pixel art sprite sheets
Viable future re-skin. Retro charm, smaller files, Aseprite workflow. Higher
overhead for AI generation. Integer CSS scaling required. Not the current approach.

### Option D — Lottie
Ruled out. 40 KB library overhead, requires AE tooling, overkill.

### Option E — CSS + emoji
Ruled out. Existing GAME-052 placeholder; not the goal.

---

## Recommendation

**Format:** 20 SVG files — 5 instigator types × 4 star-count states.  
**File path schema:** `assets/characters/{type}/{state}.svg`  
  - type: `partisan-boss`, `legal-authority`, `bipartisan-broker`, `reform-arbiter`, `neutral-admin`  
  - state: `three-star`, `two-star`, `one-star`, `zero-star`  
  - Extension is `.svg` now; path schema is otherwise format-agnostic for future re-skin.

**Style:** Flat, minimal, 2–3 colors per character. Silhouette-readable at 160–200 px.
Political-cartoon / board-game-token aesthetic.

**Palette:**
- Partisan Boss: party gold / red accent
- Legal Authority: slate blue accent
- Bipartisan Broker: split warm-red / cool-blue (one per boss)
- Reform Arbiter: teal / green accent
- Neutral Admin: muted grey-blue accent
- All: dark outline (~#1a1a2e or near-black), transparent background (game provides dark HUD chrome)

**Animation:** loopable 0.6–1.0 s CSS `@keyframes` within each SVG. State is set by
loading the appropriate file (no CSS class switching needed — each file is one state).
`prefers-reduced-motion` handled by the reaction system wrapper, not per-file.

**Audio:** 20 clips — 5 types × 4 states (or collapsed to fewer grades if authoring
20 distinct clips proves impractical; minimum 2 per type: celebratory / disappointed).
See GAME-061 for clip strategy. All clips: 0.5–1.5 s, loop-free, board-game/casual
register.

---

## AI Art Generation — Consistency Guidelines

These constraints must be embedded in every art-generation prompt for GAME-060.
Consistency across the set is more important than perfection of individual files.

### Structure
- `viewBox="0 0 200 200"` on every SVG — uniform coordinate space
- Transparent background — `<rect>` fill only if needed for game-specific dark background
- Character occupies approximately the center 140×160 px of the 200×200 viewBox
- Head-to-body ratio ≈ 1:2 (board-game token / political cartoon proportion)
- Character is centered horizontally; feet near y=190, head near y=30

### Style
- Flat fills, no gradients, no drop shadows
- Stroke weight: 2–3 px for primary outlines; 1–2 px for interior details
- Maximum 3 fill colors per character (plus the shared outline color)
- No fine detail that disappears at 160 px display size — silhouette must read clearly
- Each type must be **visually distinct as a silhouette** — different head shape, hat,
  accessory, or body outline (the player needs to recognize them at a glance)

### Cross-type consistency
- Same viewBox, same body scale, same foot/head placement across all 20 files
- Characters should feel like they come from the same illustration set — consistent
  line weight, same visual grammar, same level of detail
- Different types differ in: accent color, silhouette shape, costume/prop
- Same type across 4 states: same character, only pose and expression change

### State poses (same type, 4 poses)
- `three-star`: open, expansive, celebratory — arms up, leaning forward, big gesture
- `two-star`: positive, composed — thumbs up or approving nod, upright
- `one-star`: reserved, ambivalent — slight lean or crossed arms, neutral expression
- `zero-star`: closed, negative — hunched or turned away, disapproving gesture

### Animation
- Each SVG file represents one static pose with a short looping idle animation
- Idle animation: subtle only — gentle bob, blink, or breathing motion (0.6–1.0 s loop)
- The pose itself (the star state) is expressed through the SVG geometry, not keyframes
- `prefers-reduced-motion` suppression is handled by the wrapper CSS, not in the SVG

---

## Audio Tone Per Instigator Type

| Type | 3-star | 2-star | 1-star | 0-star |
|---|---|---|---|---|
| Partisan Boss | Short triumphant brass sting; punchy | Upbeat resolution chord | Flat "close enough" sting | Trombone wah-wah deflation |
| Legal Authority | Formal gavel + ascending chime | Measured chime | Single neutral gavel tap | Gavel + descending tone; austere |
| Bipartisan Broker | Warm celebratory chord; handshake-feel | Mild positive chord | Subdued chord; uncertain | Dull thud; resigned |
| Reform Arbiter | Bright civic fanfare; optimistic | Soft chime; steady | Quiet acknowledgment tone | Soft negative buzz or descending chime |
| Neutral Admin | Affirming ding; warm | Soft click; approving | Flat neutral click | Brief flat shrug sound |

All clips: 0.5–1.5 s, loop-free, no dramatic buildup. Board-game / casual-strategy
tonal register.

---

## Decisions

**1. SVG vs pixel art — inline SVG; format-agnostic path schema.**

SVG is the current format. The game vision doc (§TEST) names CSS/SVG loops as the
reference style. The dark-HUD strategy aesthetic is inconsistent with retro pixel charm.
Path schema (`assets/characters/{type}/{state}.*`) is otherwise format-agnostic —
no SVG-specific assumptions in loading code.

**2. Scenario-006 two-character case — simultaneous split-screen; general capability.**

Both party bosses appear side-by-side (shared outcome in current scenario). Designed
as a general capability: future scenarios may have asymmetric outcomes per panel.

**3. Tutorial character — full neutral-admin reaction.**

Tutorials are level 1 of the core game loop. Skipping animation there creates an
inconsistent first impression and signals reactions are optional rather than core UI.

**4. Instigator model — no player avatar; instigator reacts on star count.**

The player is a neutral consultant ("just a job"). The instigator (the person who hired
the player) reacts based on how well the player delivered, graded by star count
(3/2/1/0). This replaces the earlier "player avatar" concept. The instigator's
animation plays last, after all per-criterion animations finish.

**5. 20 files (one per state) vs 6 files (multi-state SVG).**

20 files (5 types × 4 states), one SVG file per state. Simpler to AI-generate
(describe one pose at a time), easier to iterate individual states independently.
Can revisit merging into multi-state files if it later becomes worthwhile.

**6. Consistency guidelines required for AI art generation.**

A shared consistency spec (viewBox, body scale, stroke weight, style grammar) must be
embedded in every art-generation agent prompt for GAME-060. Cross-set consistency is
more important than perfection of any individual file.

---

## References

- `game/scenarios/*.json` — `narrative.character` field (all 10 scenarios)
- `thoughts/shared/tickets/DESIGN-009-character-reaction-visual-style.md`
- `thoughts/shared/tickets/GAME-060-character-sprite-assets.md`
- `thoughts/shared/tickets/GAME-061-audio-clips.md`
- `thoughts/shared/tickets/GAME-062-character-reaction-system.md`
- `thoughts/shared/vision/game-vision.compressed.md` — visual aesthetic
