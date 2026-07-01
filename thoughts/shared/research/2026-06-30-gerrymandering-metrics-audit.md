---
date: 2026-06-30
researcher: Claude (Opus 4.8) + Christian Jackson-Gruber
git_commit: 042f052678d4
branch: main
repository: cgruber/redistricting-sim
topic: Domain-expert audit of the gerrymandering fairness metrics vs. their canonical definitions
tags: [audit, simulation, metrics, efficiency-gap, mean-median, compactness, VRA, pedagogy]
status: complete
last_updated: 2026-06-30
last_updated_by: Claude
---

# Gerrymandering Metrics Audit — is the political-science math right?

## Why this audit

The 2026-06-27 code-quality review's completeness-critic flagged the one thing all that
code work did **not** touch: every finding there audited "does the code do what it intends,"
none audited "is the intent itself correct." For an *educational* gerrymandering sim, the
load-bearing question is whether the fairness **metrics** — efficiency gap, mean-median,
seat allocation, compactness, majority-minority — are computed correctly and are faithful
teaching models. A subtly-wrong efficiency-gap denominator or a flipped mean-median sign
would pass every unit test and still mis-teach.

## Method

Read the implementation (`simulation/evaluate.ts`, `simulation/election.ts`,
`simulation/validity.ts`, `model/adapter.ts`) precisely, and independently gathered the
canonical reference definitions from the primary literature (Stephanopoulos & McGhee 2015;
McDonald & Best 2015; DeFord & Veomett, *Bounds and Bugs* 2024; PlanScore; Princeton
Gerrymandering Project; Brennan Center; DOJ Section 2 guidance; MGGG cut-edges;
Polsby-Popper/Reock) — see References. Then compared each metric to its reference, checking
formula, denominator/normalization, sign convention, and pedagogical faithfulness.

## Headline verdict — reassuring

**The core math is sound.** The efficiency-gap wasted-vote formula is the academically
standard one, and the mean-median difference — the single most error-prone metric in the
field (naive implementations routinely mis-label its sign; see *Bounds and Bugs*) — is
implemented with the **correct sign for its chosen convention**. The completeness-critic's
worst case (silently-wrong formulas) does **not** materialize.

The real gaps are **pedagogical fidelity and third-party/turnout robustness**, not wrong
arithmetic:
1. **Majority-minority uses raw population share, not voting-eligible population (VAP/CVAP)** —
   the one substantive fidelity gap, and it's on the VRA lesson.
2. **EG and mean-median are not two-party-normalized** — moot today (minor parties are always
   0 in the model) but not robust.
3. **Labeling**: "compactness" is actually the cut-edges measure (legitimate, but not the
   shape-based Polsby-Popper players may expect); safe/competitive thresholds and the EG
   threshold are game-calibrated, not canonical.
4. **Uniform turnout** (`turnout_rate` is loaded but deliberately unused) — an acknowledged
   simplification that shapes every metric's inputs.

---

## Metric-by-metric findings

### 1. Efficiency gap — core CORRECT; not two-party-normalized
`evaluate.ts:251-281`

**Implementation.** Per district: winner wastes `max(0, V_winner − V_total × 0.5)`; loser
wastes all its votes; a third-party winner wastes both R and D entirely. Statewide
`EG = (R_wasted − D_wasted) / Σ V_total`; the criterion tests `|EG| ≤ threshold` (0.10–0.15
in scenarios 003/007/008).

**Reference (S&M 2015).** Winner wasted `= V_winner − V_total/2` (the academic-standard
continuous threshold — matches the impl, and the `max(0,…)` guard is a safe superset);
loser wasted `= all votes` ✓. Denominator = total votes, **computed on two-party votes**
(third parties excluded from numerator *and* denominator). Positive EG (with Party A =
first) disadvantages A. The equal-turnout shortcut `EG = S* − 2V*` ("2 seats per 1% of
votes") is *exactly* equivalent to the wasted-vote formula under equal district turnout.

**Verdict.** Formula is correct. Two deviations, both moot at strict two-party (L/G/I are
hardcoded 0 in the adapter) but not robust:
- **Denominator not two-party-normalized:** it sums `V_total` including any third-party
  votes, while wasted votes only count R/D. With minor-party votes present, num and denom
  would be inconsistent.
- **The `× 0.5` win line assumes a two-party majority:** with third parties, a *plurality*
  winner can have < 50%, so `max(0, V − total/2) = 0` would understate the winner's wasted
  votes.
- Sign convention is correct and the criterion uses `|EG|`, so the gate is symmetric.
- Threshold 0.10–0.15 is *lenient* vs S&M's ~0.08 (2-seat) proposal — a defensible game
  calibration, but it's game-chosen, not canonical.

**Recommend.** Compute EG on the two-party vote per district (`V_total = R + D`) for
robustness, or add a comment stating the strict-two-party assumption. Present the threshold
as game-calibrated in teaching copy.

### 2. Mean-median difference — CORRECT sign for its convention; not two-party-normalized
`evaluate.ts:283-307`

**Implementation.** `diff = mean(district shares) − median(district shares)` for the party;
the criterion applies the operator to the **signed** value. Comment: "large positive = party
wins fewer seats than votes warrant (packed) = disadvantaged."

**Reference.** Two conventions coexist and this is *the* field's most error-prone metric:
- **Convention A** (McDonald & Best original; PlanScore; DeFord & Veomett): `median − mean`,
  positive **favors** the party.
- **Convention B** (Princeton Gerrymandering Project; Dave's Redistricting App):
  `mean − median`, positive **disadvantages** the party (packed into blowouts).
Normalization is on **two-party** district vote share.

**Verdict.** The impl is **Convention B, and its label is correct** — positive `mean − median`
= disadvantaged/packed. This is a genuinely good result: *Bounds and Bugs* documents that
naive `mean − median` code is frequently mis-labeled with the wrong party-advantage
direction, and this codebase avoided that trap. Minor: it uses the party's **raw** share
(share of all votes), not the two-party share — moot at two-party, divergent otherwise.

**Nuance — one-sided use in scenario-004** ("Lakeview: Cracking the Opposition", Ken wins all
5): `mean_median(ken) ≤ 0.1` on the *signed* value only fails if Ken is *packed*; a
Ken-favoring skew passes. This is defensible for the lesson (it rewards *efficient, uniform*
cracking and penalizes wasting Ken's votes in blowouts), but it **repurposes a symmetric
partisan-fairness measure as a one-sided "win-efficiency" gate** — a subtle pedagogical
mismatch between what mean-median *means* (bias/symmetry) and how it's *used* here.

**Recommend.** Two-party-normalize; note which convention is used (Convention A is the
"original," so a curious learner comparing to PlanScore will see the opposite sign); consider
a tooltip clarifying that in this scenario mean-median is gating *win-efficiency*, not fairness.

### 3. Compactness — legitimate (cut-edges), mis-nameable
`evaluate.ts:80-108`

**Implementation.** Per district, the fraction of its hexes' edges that are interior
(neighbour in the same district). Higher = more compact.

**Reference.** This is exactly **cut-edges compactness** (Duchin/MGGG) — a real,
academically-used measure and the discrete/graph-theoretic analog of Polsby-Popper on a
uniform grid. It is *not* the shape-based Polsby-Popper (`4πA/P²`) or Reock (`A/A_bounding-circle`)
that a player might picture.

**Verdict.** Correct and legitimate — not a bug. On a uniform hex grid the interior-edge
fraction ≈ 1 − (cut-edge fraction) ≈ a Polsby-Popper analog. The only issue is *naming*: if
the UI/teaching calls it just "compactness," a learner may conflate it with the shape metrics
courts actually cite.

**Recommend.** Label it as a grid/cut-edges compactness proxy; optionally note Polsby-Popper/
Reock exist for real geography. Low priority.

### 4. Majority-minority — population share, not VAP/CVAP  ← the substantive fidelity gap
`evaluate.ts:309-324`, `computeDistrictGroupShares`

**Implementation.** Counts districts where a demographic group's **population share**
(`population_share × total_population` aggregated) ≥ `min_eligible_share`.

**Reference (Gingles 1986; Bartlett v. Strickland 2009; DOJ 2024).** A majority-minority
district requires the group to be a majority (50%+1) of the **voting-eligible** population —
**VAP** or, increasingly, **CVAP** (citizen voting-age population). Total population is used
only for one-person-one-vote equality, *not* for the majority-minority threshold. Using total
population overstates a group's electoral presence where it skews young or non-citizen.

**Verdict.** The one substantive pedagogical/legal fidelity gap — and it's on the VRA lesson
(scenarios that teach majority-minority / the GAME-078 VRA set). The runtime model has no
VAP/CVAP field, so it approximates with population share.

**Recommend.** Either add an eligible-population fraction per group (so the criterion can use
VAP/CVAP-style shares) or, if that's out of scope for v1, make the teaching copy explicit that
this is *population* share and that the real legal test is CVAP — so the player's mental model
isn't subtly wrong on the exact point the VRA turns on. Medium priority.

### 5. Seat count / safe / competitive — sound; thresholds game-calibrated
`evaluate.ts:226-249`, `election.ts` margin

**Implementation.** `seat_count` from `seatsByParty` ✓. `safe_seats`: districts the party won
with `margin ≥ threshold`. `competitive_seats`: districts with `margin ≤ threshold`. Margin =
`winner_share − runner-up_share` (rounded to 3 decimals), the two-party victory margin ✓.

**Reference.** No canonical numeric cutoffs exist (Cook/Sabato ratings are qualitative);
analysts commonly use ~<10-pt margin = competitive, >20-pt = safe.

**Verdict.** Sound. Thresholds are per-scenario configurable, which is the right design — just
game-chosen, not canonical.

**Recommend.** Present thresholds as game-calibrated. No code change. Low.

### 6. Population balance — sound
`validity.ts:60-69`

Per-district deviation `(pop − ideal)/ideal` checked against `± tolerance`. This is the
one-person-one-vote equality test; checking every district against tolerance is a clean
(slightly stricter) form of the "overall range" measure. Correct.

### 7. Model assumption — uniform turnout
`adapter.ts:113`

Votes are **population-weighted** (`partyShare × population`); `turnout_rate` is loaded from
scenarios but deliberately unused ("turnout ignored until Sprint 3"). Implications: (a) the EG
wasted-vote formula and the 2-seats-per-1% shortcut are *exactly* equivalent here (equal
turnout is the shortcut's exact-equivalence condition); (b) the sim cannot yet teach
turnout-driven effects (e.g., packing high-turnout precincts); (c) every metric operates on
population-weighted "votes." A known, reasonable v1 simplification.

**Recommend.** When turnout is enabled, EG/mean-median inputs change (real votes ≠ population
× share) — re-verify these metrics then. Note the assumption in teaching copy. Low now.

---

## Prioritized recommendations

1. **Majority-minority fidelity (medium)** — the only substantive gap. Add an eligible-population
   (VAP/CVAP-style) fraction, or make the copy explicit that it's population share vs. the CVAP
   legal standard. This is the VRA teaching point.
2. **Two-party-normalize EG and mean-median (low, robustness)** — compute both on `R + D` per
   district; add a one-line comment on the strict-two-party assumption. Prevents silent
   mis-computation if minor-party support is ever nonzero.
3. **Labeling / teaching copy (low)** — name compactness as a grid/cut-edges proxy; present the
   EG (0.10–0.15) and safe/competitive thresholds as game-calibrated, not canonical; note the
   mean-median convention (B) since PlanScore uses the opposite sign.
4. **Mean-median one-sided use (low, optional)** — a tooltip clarifying that scenario-004 gates
   *win-efficiency*, not fairness.
5. **Turnout (low, forward-looking)** — re-verify EG/mean-median when turnout weighting lands.

## Triage

- **Fix-now:** none required — no wrong formulas. All items are enhancements.
- **File tickets:** majority-minority VAP/CVAP fidelity (#1); two-party normalization for EG +
  mean-median (#2); a labeling/teaching-copy pass (#3–4).
- **Leave as-is:** population_balance, seat_count, safe/competitive math, compactness math
  (correct); turnout (acknowledged, forward-looking).

## References

Efficiency gap: Stephanopoulos & McGhee, *Partisan Gerrymandering and the Efficiency Gap*
(U. Chicago L. Rev. 2015); PlanScore (planscore.org/metrics/efficiencygap); Brennan Center
(Petry) explainer; Veomett, *EG, Voter Turnout, and the Efficiency Principle* (arXiv:1801.05301);
Bernstein & Duchin, *A formula goes to court* (arXiv:1705.10812); Sabato's Crystal Ball
seats-votes/EG. — Mean-median: McDonald & Best (Election Law J. 2015); PlanScore
(planscore.org/metrics/meanmedian); Princeton Gerrymandering Project methodology; DeFord &
Veomett, *Bounds and Bugs* (arXiv:2406.12167); Dave's Redistricting App advanced measures. —
Compactness: MGGG cut-edges (Duchin, *Political Geometry* ch.1); redistmetrics (ALARM Lab);
Polsby-Popper / Reock. — Majority-minority: Thornburg v. Gingles (1986); Bartlett v. Strickland
(2009); DOJ Section 2 Guidance (2024); Census CVAP. — Safe/competitive: Cook PVI; Brennan
Center competitive-districts; academic 45–55% competitive band. — Symmetry/bias context:
Gelman-King bias; DeFord et al., *Implementing Partisan Symmetry* (MGGG 2020).
