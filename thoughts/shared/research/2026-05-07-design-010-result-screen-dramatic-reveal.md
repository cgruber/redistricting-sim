# DESIGN-010: Result Screen Dramatic Reveal
## Per-criterion icons, suspense timing, character flash

**Date:** 2026-05-07  
**Researcher:** Claude (Sonnet 4.6)  
**Topic:** Result screen UX — icons, timing, character interaction  
**Status:** decisions-complete  
**Gates:** GAME-066

---

## Current State (as of GAME-062)

- Criteria fade in with 120ms stagger, 0.3s `criterionReveal` animation (opacity + translateY 8px)
- `.rc-icon` shows ✓ or ✗ text; `.rc-badge` shows PASS / FAIL / OPTIONAL
- Instigator renders once in final star-count pose after all rows are visible
- Click-to-skip: instantly reveals all rows (removes animation)
- No suspense pause; no per-criterion icons; no character flash during reveal

Criterion types in the type system:

| Type | Meaning |
|---|---|
| `seat_count` | Party wins N seats |
| `majority_minority` | Minority representation threshold |
| `efficiency_gap` | Partisan waste-vote fairness |
| `mean_median` | Partisan lean statistical bias |
| `compactness` | District shape regularity |
| `safe_seats` | Guaranteed partisan strongholds |
| `competitive_seats` | Number of competitive districts |
| `population_balance` | Equal district populations |
| `district_count` | Correct number of districts drawn |

Plus validity rows (prepended for invalid maps):

| ID prefix | Meaning |
|---|---|
| `validity:all-assigned` | All precincts assigned to a district |
| `validity:population-balance` | Structural pop balance (not criterion) |
| `validity:contiguity-*` | District N is contiguous |

---

## Decision 1: Per-Criterion Icon Spec

### Icon source: separate flat SVG symbol set, not character sprites

Character sprites are 200×200px narrative characters (DESIGN-009). Per-criterion icons
are abstract symbolic concepts — different design vocabulary. Use a minimal flat SVG
icon set (24×24 viewBox, same dark-background-optimized palette, 2px stroke weight,
no fills except accent color), inline as `<svg>` elements.

### Icon assignments

| Criterion type | Icon concept | SVG description |
|---|---|---|
| `district_count` | Grid / map regions | 2×2 grid of squares; clean boundary lines |
| `population_balance` | Balance scales | Simple scale beam with two pans; centered pivot |
| `seat_count` | Legislative seat / chair | Stylized chair or podium silhouette |
| `majority_minority` | Group / people | Two overlapping person silhouettes, one accented |
| `efficiency_gap` | Wasted votes bar chart | Two bars, one taller, labeled visually unequal |
| `mean_median` | Statistical distribution | Bell curve with mean/median lines offset |
| `compactness` | Shape regularity | Circle vs. irregular blob (split icon) |
| `safe_seats` | Partisan lock / shield | Shield with party-color fill (dynamic, based on party) |
| `competitive_seats` | Racing / contest | Two flag markers close together on a line |
| `validity:all-assigned` | Complete checklist | Grid with all cells filled |
| `validity:population-balance` | Imbalanced scales | Same scales icon, tipped to one side |
| `validity:contiguity-*` | Broken link / chain | Chain with one broken link |

### Icon placement: inside the criterion row, replacing ✓/✗

The `.rc-icon` slot already exists and is sized for a single character. Replace the ✓/✗
text with the type-specific SVG icon (24×24). The icon communicates WHAT the criterion
is; color-tinting on pass/fail communicates the verdict (icon tints green on pass,
red on fail-required, muted on optional). The PASS/FAIL badge already handles the
explicit verdict label — no redundancy.

**Why not a separate panel element?** The row-level layout (icon | description | badge)
is already the right information hierarchy. Adding a separate icon panel above the list
would dilute focus and require more vertical space.

---

## Decision 2: Suspense Timing Spec

### Two-phase reveal per row

Each criterion row goes through two states:

**Phase 1 — Appear (0–300ms):** Row fades in (current `criterionReveal` animation).
Badge shows "CHECKING…" in a neutral muted style. Icon shows in neutral grey.

**Phase 2 — Resolve (after 1 200ms hold):** Badge snaps to PASS / FAIL with a
brief pop scale animation (0.15s ease-out). Icon color-tints to green/red.

Total per-row duration: ~1 500ms (300ms fade + 1 200ms hold + 150ms flip).

**Stagger between rows:** 400ms (up from 120ms — gives each row time to resolve
before the next appears, maintaining a one-at-a-time feel without being glacial).

**Total for 5 rows:** ~5.5s. For 8 rows (invalid map with validity rows): ~8s.
Click-to-skip short-circuits all of this.

### Skip behavior

Click anywhere on result screen → skip all pending animations, jump all rows
instantly to final resolved state. Same event listener pattern as today.

### "Checking" indicator style

Badge text "CHECKING…" with a subtle opacity pulse CSS animation (0.8s loop,
50%→100% opacity). No spinner, no audio dependency. Simple and legible.

Audio drum-roll is out of scope for this research (GAME-061 territory) — the visual
alone must carry the suspense.

### Why 1 200ms hold (not 3 000ms)?

The ticket suggested "~3 seconds" but with stagger the actual wall-clock wait per
criterion is ~1.5s already. 3s per criterion × 5 criteria = 15s before the instigator
appears — too long without skipping. 1.2s hold keeps the moment without punishing
patient players. The instigator reveal (below) adds a final beat that lands harder
because it comes after the criteria are done.

---

## Decision 3: Character Flash Behavior

### No per-criterion flash — instigator holds neutral, then delivers binary verdict

DESIGN-009 established: instigator "plays LAST after criteria." Per-criterion flashing
would require mapping every criterion type to an instigator concern, which doesn't
generalize (a federal judge cares about all criteria differently than a partisan boss).

**Revised sequence:**

1. Instigator renders in **neutral/waiting pose** at the top of the result card before
   criteria begin.
2. Criteria reveal one by one (Phase 1 + Phase 2 per Decision 2).
3. After the last criterion resolves: **0.8s dramatic pause** (all rows visible, no
   new motion).
4. Instigator **transitions to approve or disapprove pose** with a CSS cross-fade (0.4s).
   Audio clip plays (GAME-061).
5. Overall verdict text ("Map Passed!" / "Map Failed") pulses once.

### Why not per-criterion flash?

- 9 criterion types × 5 instigator types = 45 mapping decisions with no clear rules
- Flash on every criterion cheapens the moment — the instigator's reaction is the
  narrative payoff, not a running commentary

### Pose logic: binary, not graduated by star count

The instigator's final pose is **binary**:

- **Approve** — any stars (1, 2, or 3): the player's map is accepted; they can proceed.
  Maps to a positive pose (e.g., thumbs-up / satisfied / celebratory depending on type).
- **Disapprove** — zero stars: the map requires rework.
  Maps to a negative pose (e.g., head-in-hands / rejection depending on type).

The star count (0/1/2/3) is still computed and displayed as the score, but the
instigator's visual only needs two states for this sequence. The graduated DESIGN-009
four-pose schema (three/two/one/zero-star) still applies to the sprite assets — the
approve pose maps to `three-star` or `two-star` (whichever best fits the art),
disapprove maps to `zero-star`. The `one-star` pose is not used in this flow.

### Neutral waiting pose

The instigator needs a distinct pre-reveal visual state. Options:

**Option A** — Reuse an existing pose (e.g., `two-star`) as neutral waiting.
Inexpensive; slightly misleading (implies outcome before reveal).

**Option B** — Add a 5th SVG file per instigator type: `waiting.svg` (arms folded,
watching). 5 new files. Clean semantic separation.

**Recommendation: Option B** — the neutral-waiting pose is the *first* thing the
player sees when the result screen opens. Reusing an "approve" pose before the verdict
is known undercuts the reveal. This is the right long-term answer. GAME-066 to
commission or generate `waiting.svg` per type alongside the four star-state files.

### Foot alignment

Sprites must be anchored at the feet across all poses — neutral → approve/disapprove
should read as a change in posture/expression, not a positional jump. GAME-066
implementation constraint: CSS `background-position` (or absolute positioning) must
pin the character at a consistent foot-baseline across pose transitions. The
200×200 viewBox in DESIGN-009 and the foot placement spec (feet near y=190) already
support this — implementation must honor it.

---

## Decision 4: Icon-to-DESIGN-009 Relationship

Per-criterion icons are **a separate flat/minimal icon set**, not derived from or
part of the character sprite system.

- Character sprites: 200×200 viewBox, narrative characters, complex fills, DESIGN-009 palette
- Criterion icons: 24×24 or 36×36 viewBox (try both in implementation, pick by visual weight),
  abstract/symbolic, 2px stroke, no narrative content

Both use transparent backgrounds and are dark-bg optimized. Both inline as SVG.
No shared file schema — criterion icons live at `game/web/src/ui/criterion-icons.ts`
(exported as inline SVG strings, not separate files — too small to warrant HTTP
requests).

---

## Summary of Decisions

| # | Decision |
|---|---|
| 1 | Icons: separate flat SVG symbol set; 24×24 or 36×36 (try both); inline in TS; one per criterion type |
| 2 | Placement: inside `.rc-icon` slot, replacing ✓/✗; color-tinted on result |
| 3 | Timing: 400ms stagger (tentative, iterate); 1 200ms CHECKING hold; 150ms flip; click-to-skip |
| 4 | Instigator: binary approve (any stars) / disapprove (0 stars); starts in new `waiting.svg` neutral pose; transitions after 0.8s pause; foot-anchored so transition reads as posture not position |
| 5 | Icons separate from DESIGN-009; criterion icons in `criterion-icons.ts` as SVG strings |

---

## References

- `thoughts/shared/research/2026-05-02-design-009-character-reaction-visual-style.compressed.md`
- `thoughts/shared/tickets/GAME-066-result-screen-dramatic-reveal-impl.md`
- `game/web/src/model/scenario.ts` — criterion type union (line 175–183)
- `game/web/src/main.ts` — `showResultScreen()` (line 768)
- `game/web/styles.css` — `.result-criterion`, `@keyframes criterionReveal` (line 582–631)
