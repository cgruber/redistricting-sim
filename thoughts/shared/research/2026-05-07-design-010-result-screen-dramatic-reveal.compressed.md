<!--COMPRESSED v1; source:2026-05-07-design-010-result-screen-dramatic-reveal.md-->
§META
date:2026-05-07 researcher:Claude(Sonnet 4.6) topic:result-screen-dramatic-reveal status:decisions-complete
gates:GAME-066

§ABBREV
ts=thoughts/shared cr=criterion ins=instigator

§CURRENT_STATE
120ms stagger; 0.3s criterionReveal; rc-icon=✓/✗ text; badge=PASS/FAIL/OPTIONAL
$ins: final star-count pose rendered after all rows; click-to-skip removes animation
no suspense; no per-cr icons; no character flash

§CR_TYPES
seat_count majority_minority efficiency_gap mean_median compactness safe_seats
competitive_seats population_balance district_count
validity rows: validity:all-assigned validity:population-balance validity:contiguity-*

§D1_ICONS
source: separate flat SVG symbol set (not char sprites); 24×24 or 36×36 viewBox (try both; pick by visual weight); 2px stroke; dark-bg optimized
delivery: inline SVG strings exported from game/web/src/ui/criterion-icons.ts (no HTTP requests)
placement: inside existing .rc-icon slot; replaces ✓/✗; color-tinted green/red on result; badge still shows PASS/FAIL

| type | icon concept |
|---|---|
| district_count | 2×2 grid of squares |
| population_balance | balance scales (level) |
| seat_count | stylized chair/podium |
| majority_minority | two overlapping person silhouettes, one accented |
| efficiency_gap | two unequal bars |
| mean_median | bell curve with offset mean/median lines |
| compactness | circle vs irregular blob (split) |
| safe_seats | shield with party-color fill |
| competitive_seats | two flag markers close on a line |
| validity:all-assigned | grid all cells filled |
| validity:population-balance | tipped/imbalanced scales |
| validity:contiguity-* | chain with broken link |

§D2_TIMING
two-phase per row:
  phase1: fade-in 0.3s (criterionReveal as-is) → badge="CHECKING…" muted pulse; icon grey
  phase2: after 1 200ms hold → badge snaps PASS/FAIL (0.15s pop scale); icon color-tints
stagger: 400ms between rows (up from 120ms)
skip: click → all rows instantly final (same once-listener pattern)
"CHECKING" indicator: opacity pulse 0.8s loop (50%→100%); no spinner; no audio dependency
why 1.2s not 3s: 3s×5cr=15s wall-clock before $ins appears; 1.2s keeps moment; skip available

§D3_CHARACTER_FLASH
no per-cr flash — no generalizable mapping from cr type → $ins concern (9×5=45 cases)
sequence:
  1 $ins renders in neutral/waiting pose at top of card (before criteria begin)
  2 criteria reveal one-by-one (§D2_TIMING)
  3 after last cr resolves: 0.8s dramatic pause
  4 $ins cross-fades to approve or disapprove pose (0.4s); audio plays (GAME-061)
  5 verdict text pulses once
pose logic: BINARY — approve=any stars(1/2/3); disapprove=0 stars; not graduated
  approve maps to three-star or two-star SVG; disapprove maps to zero-star SVG; one-star unused here
neutral/waiting pose: new waiting.svg per $ins type (Option B — reusing approve pose misleads before reveal)
  DESIGN-009 foot spec (feet near y=190, 200×200 viewBox) already supports foot-anchoring
  GAME-066 constraint: CSS must pin foot-baseline so transition reads as posture change, not positional jump

§D4_DESIGN009_RELATION
cr icons: separate icon set; not derived from char sprites
chars: 200×200 viewBox, narrative, complex fills | cr icons: 24×24, abstract/symbolic, 2px stroke
both: transparent bg, dark-bg optimized, inline SVG
no shared schema; cr icons in criterion-icons.ts

§DECISIONS
1 cr icons: separate flat SVG; 24 or 36px (try both); criterion-icons.ts; one per type
2 placement: .rc-icon slot; replaces ✓/✗; color-tint on result
3 timing: 400ms stagger (tentative/iterate); 1 200ms CHECKING hold; 150ms flip; click-to-skip
4 $ins: binary approve(1-3 stars)/disapprove(0 stars); new waiting.svg neutral pre-reveal; 0.8s pause→pose cross-fade; foot-anchored CSS
5 icon set separate from DESIGN-009; criterion-icons.ts as SVG strings

§REFS
$ts/research/2026-05-02-design-009-character-reaction-visual-style.compressed.md
$ts/tickets/GAME-066-result-screen-dramatic-reveal-impl.md
game/web/src/model/scenario.ts:175 — cr type union
game/web/src/main.ts:768 — showResultScreen()
game/web/styles.css:582 — .result-criterion + @keyframes criterionReveal
