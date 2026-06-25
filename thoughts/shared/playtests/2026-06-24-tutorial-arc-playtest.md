# Tutorial Arc — Unattended Playtest (2026-06-24)

Run-through of the tutorial campaign (T1 → T2 → T3) while you were offline, to accumulate
items for you to verify later. We agreed to **iterate on visuals when you're back**, so this
focuses on flow, pedagogy, difficulty, and copy — not look-and-feel.

## How this was tested

Analytical playthrough grounded in the real artifacts, not vibes:
- the generated maps (`game/scenarios/tutorial-00{1,2,3}.json`) — populations, criteria, flags, narrative;
- the guided-overlay scripts (`src/tutorial/overlay.ts`);
- the rendering rules (`mapRenderer.ts`, `panels.ts`) — what the player can actually see;
- the **passing CI e2e suite** (Playwright is CI-only on this machine), which already proves
  each map is functionally winnable, the overlays advance, and the negative cases fail.

What this canNOT cover (for your eyeball pass): actual visual feel, overlay panel placement/
timing, animation, color reads, and "is the difficulty fun." Those are tagged 🟡.

NOTE: tutorial-002 "A Legal Map" is now **merged to main** (#277). This report is a snapshot
taken at the start of the tutorial revamp; the 🔴 items are being worked through in follow-up
PRs this session (the T1 epilogue fix lands with this doc; T3/T4 follow). See "Revamp progress"
at the bottom.

Severity: 🔴 likely fix · 🟡 verify when back · 🟢 confirmed working · 💡 idea/future.

## Arc at a glance

| | T1 "Welcome / Core Loop" | T2 "A Legal Map" | T3 "Hawthorn Bend" |
|---|---|---|---|
| State | shipped | **shipped (#277)** | **OLD — pre-redesign** |
| Precincts / districts | 37 / 2 | 61 / 3 | 119 / 4 |
| Guided overlay | ✅ 5 steps | ✅ 5 steps | ❌ none |
| Pre-electoral | ✅ (results+views hidden) | ✅ (results+views hidden) | ❌ results + all views shown |
| Gates | district_count | district_count + balance (±12%) | district_count + balance (±10%) |
| Contiguity | allowed (not enforced) | **required** | required |
| Teaches | select→paint→submit | balance + contiguity + validity panel | terrain is cosmetic |
| Intro slides | 3 | 2 | 3 |

The planned arc is **T1 core loop → T2 legal map → T3 "Reading the Vote" → T4 capstone**, with
the electoral layer revealed deliberately in T3 (GAME-098) and a capstone in T4 (GAME-099).
**Neither T3-redesign nor T4 exists yet.** The current T3 is the old "terrain tour," so the
arc's back half is still the pre-redesign content.

---

## T1 — "Welcome to Redistricting: Millbrook County"

**Flow:** 3 intro slides → editor opens with the 5-step overlay (orient → pick D2 → paint 5 →
undo → submit) → submit. Gates on district_count only; balance/contiguity not enforced.

- 🟢 **Trivially winnable, by design.** Any split into two districts passes; the overlay
  walks the player straight there. Correct for a first lesson — no untaught failure modes.
- ✅ **Epilogue over-promised the next tutorial — FIXED (this PR).** T1's epilogue used to say
  *"a little geography on it, and a few new ways to see what's going on,"* but post-rescope T2
  has **no geography and no new views**. Rewritten to tease what T2 actually delivers (a bigger
  map, balance + contiguity, the Map Validity panel). *Judgment: wording is my draft of your
  narrative voice — reword freely.*
- 🟡 **Edge case:** if a player paints *every* precinct into D2 (leaving D1 empty), district_count
  fails ("both districts in use"). The overlay says "split into two," so unlikely — but worth a
  glance at whether the result message explains *why* it failed in that case.

## T2 — "A Legal Map: Millbrook County"  (the new one, PR #277)

**Flow:** 2 intro slides → editor opens with the 5-step overlay (orient to the two rules →
paint → highlight the Map Validity panel → "even out + keep connected until it's green" →
submit). Gates on district_count + population_balance (±12%); contiguity required.

- 🟢 **Winnable, verified.** A clean strategy lands all three districts in tolerance and
  contiguous (BFS-checked): the compact **dense northern cap** is D1 (+6.2%), the open rural
  south splits **west / east** into D2 (+3.6%) / D3 (−9.7%). The dense town means the north
  needs *less land* — that's the lesson.
- 🟢 **The lesson bites.** A naive equal-*area* split (three horizontal thirds) fails — middle
  +13%, south −19%. So the player can't just eyeball thirds; they have to read the panel and
  adjust. The negative-case e2e confirms a lopsided map is flagged and fails.
- 🟢 **No untaught failure modes.** Both gated rules (balance, contiguity) are stated in the
  objective, slide 2, and the overlay; the validity panel reports exactly them. Views and the
  election prediction stay hidden.
- 🟢 **Density is actually visible** even with views hidden: the default district coloring
  **shades precincts by population** (denser = darker), and hovering a precinct shows `Pop:`.
  So the player can *see* the north is denser, not just infer it from the panel after the fact.
- 🟡 **Does the town read?** The gradient is gentle (town ≈ +8k over a ~3k rural base). Verify
  the darker northern cluster is obvious enough at a glance to motivate "give the north less
  land" — and that a first-timer connects *darker = more people* without a legend (the legend
  was removed game-wide; only hover spells it out).
- 🟡 **Overlay pacing.** Step 2 ("paint your districts") auto-advances as soon as **5 precincts
  are in District 2** — then steps 3–4 are click-Next while the player keeps painting. Check
  this doesn't yank the panel-highlight up before the player has really started, and that it's
  clear they still need a **third** district (the overlay step 2 copy is generic; "three
  districts" is in the objective + slide 1, but not in the paint step itself).
- 🟡 **Is ±12% the right amount of fiddly?** The balance is achievable without much hunting
  (the west/east split is forgiving), but verify it doesn't feel like trial-and-error vs.
  guided problem-solving when you play it live.
- 💡 The epilogue promises *"how the lines you draw decide who wins — reading the vote,"* which
  is exactly the planned T3 (GAME-098). Good handoff — but see the arc note below: the *current*
  T3 doesn't deliver that yet.

## T3 — "Hawthorn Bend — A Tour of the Map"  (OLD — not yet redesigned)

**Flow:** 3 intro slides (terrain types → "geography is cosmetic" → "try it") → editor with the
**full chrome** (election-result prediction + lean/county views all visible), no overlay. The
initial 4-quadrant map is **already valid**, so Submit passes immediately.

- 🔴 **This is the pre-redesign tutorial.** Planned T3 is "Reading the Vote" (reveal the
  election result *together with* the lean view — the deliberate electoral reveal; GAME-098).
  The shipped T3 instead teaches *terrain is cosmetic* and is **not guided**. Net effect on the
  arc: the electoral layer (vote prediction + lean/county views) is **revealed but never
  explained** — the player lands on a results panel and view toolbar with zero coaching, which
  is precisely the un-deliberate reveal the redesign exists to prevent.
- 🟢 **Winnable immediately** — the initial quadrants are balanced (d1 +6%, d2 −7%, d3 −8%,
  d4 +9%) and contiguous; Submit passes on the starting map. Fine for a "tour," but it's a
  zero-challenge step sandwiched after T2's real balancing task.
- 🟡 **d4 sits at +9%** against a ±10% tolerance — a single stray repaint tips it over. If a
  curious player "experiments" (the objective invites it), they can fail a map that started
  passing, with no guidance. Verify the result message is graceful there.
- 🟡 **Difficulty/size jump:** 61→119 precincts and 3→4 districts in one step, with the
  coaching removed. Even as a tour, that's a cliff right after the gentle guided T2.

---

## Cross-cutting / arc-level items

- 🔴 **Pedagogical cliff at T3.** T1→T2 are gentle, guided, pre-electoral, with the validity
  panel as the single teaching focus. T3 then jumps to: bigger map, +1 district, **no overlay**,
  **terrain everywhere**, and the **full electoral UI** with no explanation. This is the single
  biggest arc discontinuity, and it's exactly what GAME-098 (T3 "Reading the Vote") + GAME-099
  (T4 capstone) are scoped to fix. Until then, the campaign's back half doesn't match the front.
- 🔴 **Two epilogue/intro copy mismatches** (both shippable now, independent of GAME-098):
  - T1 epilogue promises geography + views → T2 has neither.
  - T2 epilogue promises "reading the vote" → current T3 is a terrain tour, not vote-reading.
  These will partly self-resolve when T3 is redesigned, but the **T1 epilogue is wrong about T2
  regardless** and worth fixing in isolation.
- 🟢 **Difficulty curve (where it's built) is sensible:** tolerance tightens 0.15(unused) →
  0.12 → 0.10; gates accrete district_count → +balance → +balance; contiguity goes
  allowed → required → required. One-new-concept-per-tutorial holds for T1 and T2.
- 🟡 **Intro slide counts vary** (3 / 2 / 3). T2's 2 is intentional (the overlay re-teaches in
  context). Just confirm the shorter T2 intro doesn't feel abrupt next to its neighbors.
- 💡 **T4 doesn't exist** (GAME-099). The campaign currently ends on the old terrain tour, so
  there's no "everything together → bridge to the real scenarios" capstone yet.

## Top things to verify when you're back (prioritized)

1. **T2 live feel** (PR #277): does the dense-north town read on the map; is the validity-panel
   balancing loop satisfying vs. fiddly; does the overlay pacing (auto-advance at 5-in-D2,
   needing a 3rd district) land cleanly?  → gates merging #277.
2. **Fix T1's epilogue** to match the real T2 (drop geography + views). Small copy change,
   shippable independent of everything else.
3. **Decide T3's near-term status:** it's the old terrain tour revealing the electoral UI with
   no coaching. Either fast-track GAME-098 ("Reading the Vote") or, as a stopgap, consider
   whether T3 should temporarily hide the results/views like T1–T2 until the redesign lands.
4. **T3 d4 at +9%** and the "experiment then fail" path — grace-check the failure messaging.

## Revamp progress (live — updated as PRs land)

- ✅ **T2 "A Legal Map" merged** (#277).
- ✅ **T1 epilogue corrected** (this PR).
- ⏳ **T3 "Reading the Vote" (GAME-098)** + **T4 "Capstone" (GAME-099)** — being drafted this
  session. T3 needs the city-limits overlay (GAME-096) for its city-view reveal.

All merged unattended under your "merge as you go, iterate on visuals later" approval. Judgment
calls and open questions are flagged inline (search "Judgment" / "🟡") for your pass.
