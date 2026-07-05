# GAME-120 — Rebuild tutorial-005 as a genuine multi-party tutorial

**Date:** 2026-07-05
**Ticket:** GAME-120 (PR after GAME-117✓/118✓/119✓; sibling GAME-121 = the independent tutorial)
**Status:** implementation

## Goal

Turn tutorial-005 from the GAME-112 debug showcase ("Hawthorn Bend: The Hollow's
Champion", where the third bloc `dhalsim` was framed as an *Independent* but behaved as a
full party at the ballot layer) into a clean **three-PARTY** tutorial: three parties each
contest every district, leans hang on real geography (GAME-119 `near`/`within`), outcomes
read as named candidates (GAME-117), and the map is gated on legality only
(district_count + population_balance + contiguity — no seat goal). Debug-gated (GAME-115).

The independent mechanic (GAME-118 home-base) is **not** used here — it is reserved for the
sibling ticket GAME-121 ("Dhalsim done right"). So `dhalsim` is retired from this scenario.

## Acceptance criteria → implementation

1. **Feature-anchored leans (GAME-119), not q-bands.** Replaced the 4 q-band/hex_dist zones
   with `near`/`within` disks anchored on the three settlements:
   - `urban_core` `near {0,0} within 2` — Hawthorn city core, Ryu (0.60). First-match, so it
     claims the dense centre before the flank disks reach in.
   - `westford` `near {-3,0} within 3` — Ken country (0.58).
   - `east_hollow` `near {3,-1} within 3` — Chun-Li's stronghold (0.52), up the Bend.
   - `countryside` default — rural remainder, leans Ryu (0.46) so a central seat is winnable.
   Weights mirror the previously-working q-band leans (sum ~1.0 for literal shares under the
   GAME-116 primary+remainder model; `ken` is `parties[0]` = primary).
2. **Third bloc is a PARTY, not an independent.** `dhalsim` → `chunli` (Chun-Li Party, teal
   `#2a9d8f`, CVD-distinct from Ken orange / Ryu purple; declared in party slot 3 so the
   two-party metrics keep `ken`/`ryu` as the majors). Contests every district.
3. **Named candidates per district (GAME-117), Street-Fighter cast, party-aligned.** Each
   party fields three candidates so a multi-seat win reads as different people. Marquee faces
   sit in the district each party carries on the intended map (Sean=west, Sakura=centre,
   Chun-Li=east):
   - Ken Party  `[Sean Matsuda, Eliza Masters, Ken Masters]`
   - Ryu Party  `[Ryu, Sakura Kasugano, Gouken]`
   - Chun-Li Party `[Cammy White, Guile, Chun-Li]`
4. **Legal-map gates only.** district_count + population_balance (±15%) success criteria +
   `rules.contiguity: required`. No seat goal. (Unchanged from the draft.)
5. **Debug-gated + smoke/winnability e2e.** Reachable only via the gated `debug` campaign.
   Extend `e2e/tutorial-005-multiparty.spec.ts`.

## The central design problem: a dense centre can't be a full-height thin district

The city (Hawthorn, plateau peak 3200) is the population mass. A naive equal-**column**
split (q≤-2 | -1..1 | q≥2) elects all three parties but the centre column is **+19%**
(over the ±15% gate) — the dense core all lands in three columns. This is the same lesson
tutorial-002 teaches ("A Legal Map"): a dense area needs the **smaller** district, not an
equal-area slice.

**Decision — keep population UNTOUCHED** (per advisor: balance depends on population;
leaving it fixed preserves whatever geometric balanceability exists). A brief experiment
lowering the peak to 1800 was **reverted** — it only made the *naive* clean-column map
squeak under the gate (+14.7%, fragile), which bought nothing for a robust test. The
**population-following** cut (three equal-population columns west→east, so the dense centre
is drawn narrowest) balances comfortably at the untouched peak.

## Feasibility proof (peak 3200, verified against election.ts winner math + real hex adjacency)

Two independent partition strategies are each **balanced (±15%), contiguous, 3 distinct
winners**:

- **(A) pop-following thirds:** Ken **+9.9%** / Ryu **+21.3%** / Chun-Li **+6.1%**;
  devs `[+2.4, +0.2, -2.6]%`; all contiguous.
- **(B) compact centre + tuned flanks (tutorial-002 pattern):** Ken **+12.7%** /
  Ryu **+26.1%** / Chun-Li **+7.1%**; devs `[+5.7, +2.8, -8.5]%`; all contiguous.

Chun-Li's east seat is the tightest (~6-7%) — comfortable for a tutorial and the intended
teaching tension (pack the east and Chun-Li wins; crack it across districts and her ~40%
base dilutes below plurality everywhere). Winners confirm the anchors land in the right
flanks (west→Ken, centre→Ryu, east→Chun-Li).

The e2e paints a balanced 3-winner map by a legible coordinate/strategy rule (not an index
array), submits, and asserts a passing map with three distinct named winners.

## overlay.ts

`guided: true` with **no** registered `TUTORIAL_005` script degrades gracefully to a no-op
(`overlay.ts:233` `if (!script) return`), so the draft was not broken — just silently
un-coached. Since T4 has a coach script and this is the next tutorial, author a short
`TUTORIAL_005` step script (light orientation over the three-party map) and register it, so
`guided: true` is honest.

## Merge gate (visual PR)

First genuinely visual PR of the 117→121 sequence. The standing authorization ("You can
merge these if they have proper agentic PR review… I'll test at the end") covers merging,
but per the eyeball-in-dev memory + advisor, substitute **rigorous preview-tool
self-verification** for the user's eyeball as a firm gate: three-party result card with
named candidates rendering; three plurality colours distinguishable on the lean map (teal
vs orange vs purple, CVD); no console errors. Hold for the user only if something can't be
confidently verified.

## Implementation discoveries (found during preview + test verification)

Two issues surfaced that the plan did not anticipate; both are intrinsic to this being the
FIRST shipping 3-party scenario, and both are fixed in this PR.

### 1. Cross-surface party-colour mismatch — the lean map ignored authored colours

The plan's merge gate assumed the lean map would render Chun-Li in her authored teal.
Preview showed **gold** instead. Root cause: `mapRenderer.hexFill` (lean) and the
precinct-info bar both resolved colours via `partyColor(parties, id)` — the PARTY_PALETTE
fallback indexed by party ORDER — never the scenario-authored `Party.color`. The results
panel (`panels.ts:colorOf`) *does* honour authored colours, so the SAME party rendered two
colours across surfaces (teal badge, gold map).

Only Chun-Li looked wrong because `ken=#c96d00` and `ryu=#7b35a8` happen to equal
PARTY_PALETTE slots 0/1 exactly — authored==palette masks the bug for parties 1–2; only
slot-3 teal deviates from the palette's slot-3 gold.

Why it had to be fixed here (not deferred): the lean view **pales every colour toward
L=0.82 as the plurality margin shrinks** (`mapRenderer.ts` LEAN_PALE_L), so contested
precincts separate by HUE alone. Palette orange (~32°) and gold (~44°) collapse into
near-identical light ambers when paled — illegible in exactly the contested regions a
redistricting tutorial spends its time in. Authored teal (~173°) stays distinct through the
paling. Conforming the scenario to palette-gold (the zero-code option) would make the lean
map genuinely unreadable, so it was rejected.

**Fix (Path A):** thread the authored `partyColors` map into the renderer (extended
`setParties`), add `SvgMapRenderer.colorOf(party) = this.partyColors[p] ?? partyColor(...)`
mirroring `panels.ts:colorOf`, and use it at the two `parties.length > 2` call sites (lean
`hexFill` + precinct-info bar). Entirely inside the >2-party branches — the 2-party PuOr
gradient (T1–T4 + educational scenarios) is untouched. Blast radius: **tutorial-005 is the
only >2-party scenario today** (verified by counting `.parties` across all scenario JSON),
so this changes nothing shipping except this tutorial; it also front-runs GAME-121's
independent tutorial (also 3-party). Verified in preview: lean map now renders orange/teal/
purple, and the Chun-Li winner badge + her map territory are the same teal.

### 2. `home-independent.spec.ts` (GAME-118 fixture) broke on the rebuild

That test uses tutorial-005 as a raw 3-party FIXTURE — it intercepts the JSON and promotes
`parties[2]` to a home-base independent to exercise GAME-118's ⌂-pin/off-ballot render
paths. Two breakages, both fixed:
- It hard-coded the slot-2 name **"Dhalsim"**; the rebuild makes `parties[2]` the Chun-Li
  Party, so the pin now reads "⌂ Chun-Li Party". Updated the assertion + stale comments.
- The new `TUTORIAL_005` coach overlay's scrim intercepts pointer events. The test paints
  via direct store calls and asserts DOM text (both bypass the scrim), so it reached its
  first real `hover` before failing. Suppressed the coach via the per-scenario `complete`
  flag — the same mechanism `tutorial-005-multiparty.spec` already uses. (These two specs
  are the only e2e that load tutorial-005.)

## Out of scope

- Independent / home-base mechanic (GAME-121).
- Terrain changes — T4's terrain is "a river", which T5 already has (the Bend); the
  GAME-119 "carry T4 terrain" note is effectively already satisfied. No map/radius change.
- A general "honour authored colours everywhere" pass — the two >2-party renderer call
  sites are fixed; a broader audit (if any 2-party surface also palette-indexes) is not this
  ticket's concern since every other scenario's authored colours already equal the palette.
