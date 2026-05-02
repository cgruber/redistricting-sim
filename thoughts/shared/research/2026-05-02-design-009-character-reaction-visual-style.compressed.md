<!--COMPRESSED v1; source:2026-05-02-design-009-character-reaction-visual-style.md-->
§META
date:2026-05-02 last_updated:2026-05-02 researcher:Claude(Sonnet 4.6)
topic:character-reaction-art-style-audio status:decisions-complete approved

§ABBREV
ts=thoughts/shared pb=partisan-boss la=legal-authority bb=bipartisan-broker
ra=reform-arbiter na=neutral-admin ins=instigator

§SUMMARY
Player = neutral consultant ("just a job"). $ins (boss/customer who hired player) reacts on
star count (3/2/1/0) — not binary pass/fail. $ins animation plays LAST after all
per-criterion animations finish. 5 $ins types, curated roster, scenarios pick one.
Design space reserved for custom $ins art in future custom-scenario tooling (no impl now).
Format: 20 SVG files (5 types × 4 states). Per-state files (not multi-state).

§ROSTER
| type | scenarios | $ins | 3-star | 2-star | 1-star | 0-star |
|---|---|---|---|---|---|---|
| $pb | 002 003 004(Ken) 009(Cat) | party boss | fist pump ecstatic | satisfied thumbs up | grudging shrug | head in hands furious |
| $la | 005 | federal judge | gavel+scales balanced beaming | measured nod | furrowed reluctant | gavel scales tipped rejection |
| $bb | 006 | both party bosses (side-by-side) | both handshake celebratory | cautious handshake | one nods other uncertain | both crossed arms |
| $ra | 007 008 | reform commission | bright thumbs-up balanced-scales | steady approval | reserved acknowledgment | thumbs-down head-shake |
| $na | tutorial-001 tutorial-002 | supervisor | checkmark warm-smile | approving nod | mild nod "acceptable" | shrug disappointed |
state CSS names: three-star two-star one-star zero-star
006 special: both bosses share outcome (criteria req BOTH parties); split-screen = general capability for future asymmetric outcomes

§OPTIONS
A pure-CSS: ruled out — no personality
B inline-SVG+per-state-file: CHOSEN — 20 files (5×4); AI-gen one pose at a time; easy per-state iteration
C pixel-art: viable future re-skin — not current approach
D Lottie: ruled out — 40KB lib overkill
E CSS+emoji: ruled out — placeholder only

§FILE_SCHEMA
path: assets/characters/{type}/{state}.svg
types: partisan-boss legal-authority bipartisan-broker reform-arbiter neutral-admin
states: three-star two-star one-star zero-star
ext: .svg now; path otherwise format-agnostic for re-skin

§STYLE
viewBox: 0 0 200 200 (ALL files — uniform coordinate space)
background: transparent
character: center 140×160px of viewBox; head near y=30; feet near y=190; centered horiz
head-body ratio: ~1:2 (board-game token / political-cartoon)
fills: flat; no gradients; no drop-shadows
stroke: 2-3px primary outline; 1-2px interior detail
colors: max 3 fills per char + shared dark outline (~#1a1a2e); transparent bg
detail: silhouette reads clearly at 160px display — no fine detail that disappears
palette: $pb=gold/red $la=slate-blue $bb=split-warm-red/cool-blue $ra=teal/green $na=muted-grey-blue

§CONSISTENCY [EMBED IN EVERY GAME-060 ART-GEN PROMPT]
cross-type: same viewBox, same body scale, same foot/head placement — one illustration set
same type across states: same character, only pose+expression changes
types differ by: accent color + silhouette shape + costume/prop (must be distinct silhouettes)
state poses (applies to all types):
  three-star: open expansive celebratory — arms up, big gesture, leaning forward
  two-star: positive composed — thumbs up or approving nod, upright
  one-star: reserved ambivalent — slight lean or crossed arms, neutral expression
  zero-star: closed negative — hunched or turned away, disapproving gesture
animation: subtle idle only (bob/blink/breathing 0.6-1.0s loop); pose = SVG geometry not keyframes
prefers-reduced-motion: handled by wrapper CSS, not in SVG

§AUDIO
20 clips (5 types × 4 states); collapse to 2/type (celebratory/disappointed) if authoring 20 proves impractical
all: 0.5-1.5s loop-free board-game/casual register
| type | 3-star | 2-star | 1-star | 0-star |
|---|---|---|---|---|
| $pb | triumphant brass sting | upbeat resolution chord | flat "close enough" sting | trombone wah-wah |
| $la | formal gavel+ascending chime | measured chime | neutral gavel tap | gavel+descending tone |
| $bb | warm celebratory chord | mild positive chord | subdued uncertain chord | dull thud resigned |
| $ra | bright civic fanfare | soft steady chime | quiet acknowledgment | soft negative buzz |
| $na | affirming ding warm | soft approving click | flat neutral click | brief flat shrug sound |

§DECISIONS
1 format→inline SVG per-state file; path schema format-agnostic
2 006 case→split-screen both bosses; general capability for asymmetric future scenarios
3 tutorial→full $na reaction; tutorials=level-1 core loop
4 $ins model→no player avatar; $ins reacts on star count (3/2/1/0); plays last after criteria
5 20 files (5×4)→one file per state; AI-gen one pose at a time; easier per-state iteration
6 consistency spec→embed in every GAME-060 art-gen prompt; cross-set coherence > individual perfection

§REFS
game/scenarios/*.json → narrative.character (all 10 scenarios)
$ts/tickets/DESIGN-009-character-reaction-visual-style.md
$ts/tickets/GAME-060-character-sprite-assets.md
$ts/tickets/GAME-061-audio-clips.md
$ts/tickets/GAME-062-character-reaction-system.md
$ts/vision/game-vision.compressed.md → visual aesthetic
