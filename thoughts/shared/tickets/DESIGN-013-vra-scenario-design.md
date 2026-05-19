---
id: DESIGN-013
title: VRA scenario design — "The 55% Problem" and "The Proxy Problem"
area: design, content
status: open
created: 2026-05-18
---

## Summary

Design two new educational scenarios exploring the Voting Rights Act and race-conscious
redistricting, placed in the Educational campaign after Valle Verde (scenario-006). The
scenarios use the Virginia Bethune-Hill saga and Louisiana v. Callais (April 2026) as
narrative anchors. Together they form a two-part contrast: (A) the dual-failure zone of
majority-minority districting under the VRA, and (B) the current "colorblind trap" where
both VRA and partisan-gerrymander challenges are now largely foreclosed.

See research: `thoughts/shared/research/2026-05-18-vra-legal-political-landscape.md`

Prior research on the game's Gingles / majority_minority model:
`thoughts/shared/research/2026-04-24-vra-and-bloc-voting-model.md`

---

## Scenario A — "The 55% Problem"

### Educational goal

A district drawn *more* majority-minority than necessary can be struck down as an
unconstitutional racial gerrymander. The player must achieve minority representation without
mechanically targeting a racial percentage — navigating between two failure modes.

### Narrative framing (fictional names, real legal pattern)

Opening slides: "The legislature drew District 4 with a mechanical 55% minority-voter floor —
citing federal preclearance as justification. Courts have since ruled this unconstitutional:
race was the *predominant factor*, overriding compactness and county integrity. You must redraw
to give the minority community real representation — without using race as your primary compass."

### Two failure modes

- **Fail A (VRA violation)**: the minority-opportunity district BVAP drops below the functional
  threshold where minority voters can reliably elect their preferred candidate. `majority_minority`
  criterion fails.
- **Fail B (racial gerrymander)**: the map achieves BVAP concentration only by fragmenting
  naturally compact geographic areas. `compactness` criterion fails. (The game cannot formally
  adjudicate intent, but the compactness failure stands in for the legal judgment.)
- **Pass**: functional minority-opportunity district that also satisfies compactness and
  minimizes county splits.

### Criteria

| Criterion | Required | Notes |
|-----------|----------|-------|
| `majority_minority` | yes | Functional threshold (minority voters can elect preferred candidate) |
| `compactness` | yes | Tightened threshold — forces geographic integrity |
| `county_splits` | optional (bonus) | Minimizing splits earns extra star |

### Starting map

The initial assignment has the "illegal" 55%-floor configuration: a highly elongated,
fragmented district that achieves BVAP but fails compactness badly. Player cannot win by
submitting unchanged.

### Map design notes

- Use terrain features (DESIGN-008 / GAME-075): coastal or riverine geography creates natural
  compactness anchors that the player can use to draw a coherent district
- Use `group_schema` + `ethnicity` dimension (same pattern as Valle Verde / GAME-026)
- Realistic population gradient: minority community concentrated in an urban coastal/riverside
  cluster; rural areas more mixed
- Scenario file: coordinate ID with GAME-078 implementation

---

## Scenario B — "The Proxy Problem"

### Educational goal

Post-Callais (2026), what Section 2 required in 2024 is now what the 14th Amendment prohibits.
States can label racial cracking-and-packing as partisan and face no legal challenge from either
direction (Rucho foreclosed partisan claims in 2019; Callais now requires intent for VRA claims).
The player experiences trying to achieve minority representation using only proxy data — no
explicit race column.

### Narrative framing

Opening slides: "The Supreme Court just struck down the majority-minority district that courts
ordered drawn two years ago. Race-conscious redistricting is now constitutionally suspect.
You're the new chair. The community still needs fair representation — but you can't look at
racial data. Use what you can see: income, language, voting history. Draw a fair map."

### Mechanic: hidden race data

- Scenario has `"hide_race_demographics": true` flag
- Demographic panel shows **proxy fields only**: median income, language-minority %, party lean,
  voting history lean — but NOT the race/ethnicity column
- `majority_minority` criterion is still present and evaluated against the underlying (hidden)
  racial data
- Player must reason from proxies to find the minority community's geographic footprint
- Result screen reveal: after evaluation, the race data is shown — "here's where the minority
  community actually lived" — so the player can see how well their proxy reasoning worked

### Criteria

| Criterion | Required | Notes |
|-----------|----------|-------|
| `majority_minority` | yes | Evaluated against hidden race data |
| `population_balance` | yes | Standard |
| `compactness` | optional (bonus) | |
| `efficiency_gap` | optional (bonus) | Bonus for drawing fair partisan outcomes too |

### New scenario format fields required

- `hide_race_demographics: boolean` — flag in scenario JSON; demographic panel respects it
- Precinct data: add `income_median`, `language_minority_pct` fields alongside existing
  `group_percentages` (which are hidden but still used for criterion evaluation)

### Map design notes

- Same region as Scenario A (or adjacent), showing the "before" and "after" of the legal shift
- Terrain features: a river that roughly follows the minority community boundary, making the
  geographic inference task tractable
- Enough proxy signal correlation (income + language + lean) that a careful player can find
  the right district shape

---

## Campaign placement

Both scenarios placed in the Educational campaign after Valle Verde (scenario-006):
- Scenario A: position 7 in Educational campaign (currently scenarios 002–009 fill 1–8)
- Scenario B: position 8 (pushing existing scenarios 007–009 to positions 9–11)

Exact scenario file IDs and manifest order determined during GAME-078 implementation.

---

## Goals / Acceptance Criteria

- [ ] Scenario A narrative, criteria, starting map layout, and two fail modes designed
- [ ] Scenario B narrative, criteria, proxy-data mechanic, and result-screen reveal designed
- [ ] `hide_race_demographics` flag and proxy precinct fields specified for loader/schema
- [ ] Terrain feature requirements communicated to GAME-075 (both scenarios need terrain)
- [ ] Both scenarios reviewed for educational accuracy and political balance
- [ ] Campaign placement determined; manifest order specified for GAME-078

## Out of scope (this ticket)

- Implementation (GAME-078)
- Actual scenario JSON authoring (GAME-078)
- Map generator updates (GAME-075)

## References

- Research: `thoughts/shared/research/2026-05-18-vra-legal-political-landscape.md`
- Prior VRA/Gingles research: `thoughts/shared/research/2026-04-24-vra-and-bloc-voting-model.md`
- GAME-078 — implementation (trails this)
- GAME-075 / DESIGN-008 — terrain features (both scenarios need terrain; coordinate map design)
- GAME-026 — Valle Verde (majority_minority criterion, group_schema, ethnicity dimension)
- Key cases: Bethune-Hill v. Virginia; Louisiana v. Callais (2026); Thornburg v. Gingles
