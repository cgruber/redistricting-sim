---
date: 2026-06-23
session: unattended run (user AFK) — review/merge + filter toolbar
status: complete (pending your eyeball)
---

# Playtest log — what to verify when you're back

Serve locally: `bazel run //game:serve-local` → http://localhost:58080

## TL;DR of the unattended run

- **Merged PR #267** (generation overhaul: GAME-088 population field + GAME-089
  population-aware counties + BUILD-010 release-script fix) — squash to main.
- **Merged PR #268** (GAME-091: scenario-002 reapportionment opener — narrative,
  result debrief, Clearwater Valley rename, old-3-county-map start, cosmetic river,
  reproducible overlay) — squash to main.
- **PR #269 (GAME-093) — DRAFT, NOT merged**: right-side map filter toolbar (placeholder
  icons). CI green. Left open for your eyeball (I can't visually verify styling
  unattended). Mark "Ready for review" + merge once it looks right.
- Paused all further scenario generation/tuning per your instruction.

## Status update (2026-06-24, user back)

- ✅ **scenario-002 ACCEPTED** — played through, map/instructions correct; difficulty is
  fine ("not even terribly hard with the instructions"). GAME-091 confirmed accepted.
- 🐛 **Result screen overflows** the viewport with no scroll (the epilogue lengthened
  the card) — affects desktop. Filed **GAME-094** (preferred fix: epilogue on a second
  "Continue →" panel after the reveal).
- 🔎 **Filter toolbar (PR #269)** served for visual review.

## ⚠️ Still awaiting your call

1. **Filter toolbar (PR #269)** — vertical icon buttons top-right over the map. Placeholder
   icons. Decide if placement/look is right → mark "Ready" + merge; real icons later.
2. **West "suburb ring"** — moving (−2,1)/(−2,2) into West county made West's inner edge
   read as suburbs-in-a-different-county. Decide: keep / lean into narratively / reshape.

## What to playtest (checklist)

scenario-002 ("Clearwater Valley: The Governor's Map"):
- [ ] Intro: 5 slides (Three Counties → A City That Grew → Seats Not Votes → Know the
      Ground → Your Move: Packing). Reapportionment story lands.
- [ ] Starts with 3 districts painted = the 3 counties (City=d1, East=d2, West=d3),
      district 4 empty. A 2-Ryu / 1-Ken "old map".
- [ ] "Show County Borders": river hugs the W/E county line N+S and splits the city
      center; county dashes render OVER the river.
- [ ] Hover a precinct: shows county name + real party names (Ken/Ryu), not "Party 1/2".
- [ ] Win it (pack the east-bank Ryu into one district, spread Ken across the other 3
      → Ken 3 / Ryu 1). Result screen shows the teaching debrief below the criteria.
- [ ] Density reads like a real city (dense non-circular core ~7.5k, rural ~650).

Filter toolbar (after merging #269):
- [ ] Three icon buttons top-right over the map; district view active by default.
- [ ] Lean button recolors to partisan lean; district button back. County button on/off.
- [ ] Header buttons stay in sync.

## Notes / decisions made unattended

- Reviews done inline (your standing preference). Merged #267 and #268 on clean LGTM +
  green CI (you'd eyeballed most of scenario-002 live). Did NOT merge the visual draft
  toolbar (#269) — left for your eyeball, per "merge if LGTM" + the eyeball-visual-PRs rule.
- scenario-002 hand-finishing is reproducible: regenerate from spec, then apply
  `game/scenarios/scenario-002.overlay.{json,jq}` (documented in the spec header).
- New tickets: GAME-090 (density realism: leapfrog developments), GAME-092 (scenario map
  editor — to replace hand-editing JSON), GAME-093 (this toolbar).

## Suggested next steps (when you're back)

- Eyeball + merge #269 (toolbar); decide the West-ring question; full scenario-002 play.
- Real icons for the toolbar (asset gen + comparison).
- Resume scenario work: tutorial migration to the pipeline (per project direction in
  memory: pipeline generates all scenarios+tutorials, hand-tweaked for pedagogy).
