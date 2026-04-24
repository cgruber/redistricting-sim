---
date: 2026-04-24
researcher: claude (web-search-researcher)
branch: main
repository: cgruber/redistricting-sim
topic: election-simulation-and-evaluation-metrics
tags: election-simulation, fptp, efficiency-gap, compactness, gerrymandering-metrics
status: complete
last_updated: 2026-04-24
last_updated_by: claude
---

## Summary

The current spike's FPTP model — summing precinct party vote shares within each district and
awarding the seat to the plurality winner — is educationally sound and matches how real-world
tools like Dave's Redistricting App approach simulation. The efficiency gap formula is
well-defined (statewide aggregate of wasted votes, ±7% threshold) and sufficient for v1
provided it is paired with compactness and population balance. For a hex-grid game without
real geographic coordinates, **graph-topology compactness (cut-edge fraction) is the right
choice** — it is coordinate-free, principled, and more legible than perimeter-based scores.

## FPTP Model Assessment

### Is the Current Model Correct?

Yes. FPTP in the redistricting context is precisely "sum the votes for each party within the
district boundary, the party with the plurality wins the seat." The current spike does exactly this.

**Educationally acceptable simplifications:**

- **Fixed vote shares per precinct.** Real elections vary due to candidate quality, local issues,
  and campaign spending. Dave's Redistricting App (DRA) sidesteps this by building a composite
  VPI (Voter Preference Index) from multiple past elections. For an educational game, fixed
  precinct partisanship is acceptable — it removes confounds and lets the player focus on the
  structural lesson.
- **Fixed turnout.** More consequential than fixed vote shares: differential turnout is a known
  mechanism in gerrymandering (packing low-turnout communities wastes fewer opposition votes).
  For v1, fixed turnout is acceptable as long as scenario notes make the assumption clear.
  A later scenario could introduce turnout variation as its teaching point.
- **Ignoring candidate quality, incumbency effects, campaign spending.** Acceptable for v1.

### What Existing Tools Do

| Tool | Election Model |
|---|---|
| Dave's Redistricting App | Composite VPI across multiple real elections; two-party vote shares; no candidate simulation |
| Districtr | Community mapping focus; no partisan election simulation built in |
| The Redistricting Game (USC 2007) | Simple majority-wins per district; fixed partisan data |
| Princeton Gerrymandering Project | Uses actual election results for post-hoc analysis; not a player sim |
| PlanScore | Applies historical precinct election data to user-drawn maps; closest to the spike's model |

The current model is consistent with all educational predecessors.

## Efficiency Gap

### Exact Formula

**Step 1: Per-district wasted votes.**

For each district:
- Losing party: all votes cast for that party are wasted.
- Winning party: votes in excess of 50% + 1 of total district votes are wasted.
  `wasted_winner = votes_winner − floor(total_votes / 2) − 1`

**Step 2: Sum statewide.**

```
WastedA = Σ (wasted votes for party A across all districts)
WastedB = Σ (wasted votes for party B across all districts)
TotalVotes = Σ (all votes across all districts)

EfficiencyGap = (WastedA − WastedB) / TotalVotes
```

A positive value means party B has the structural advantage.

**Simplified formula** (when only seat margin and vote margin are known):
```
EG = (SeatMargin − 50%) − 2 × (VoteMargin − 50%)
```
Valid when district populations are equal (true for the game's hex grid with uniform hex populations).

**Important:** The efficiency gap is calculated statewide (aggregate across all districts), not
per-district.

### Thresholds

Stephanopoulos and McGhee's original 2014 paper proposed **±7%** as the legal threshold for
presumptive unconstitutionality. PlanScore historical examples: NC 2012 at -20.3% (extreme
Republican advantage), TX 1992 at +20.3% (extreme Democratic advantage).

For the game: display the raw percentage with a dial: <7% neutral, 7–15% significant, >15% extreme.

### Educational Sufficiency

The efficiency gap alone is **not sufficient**. Key limitations:

- It conflates packing and cracking into one number; players cannot tell which tactic they used.
- Duchin and Bernstein argue it must be paired with compactness.
- Princeton's Gerrymandering Project does not use the efficiency gap at all in its current report
  card, preferring mean-median difference, partisan bias, and packed-wins spread.
- The metric is sensitive to landslide elections.

**Recommendation:** Use the efficiency gap as the primary partisan fairness number, but display
it alongside seat share, vote share, and the **mean-median difference**. The mean-median
difference (average party vote share minus median party vote share across districts) is easier
to explain verbally and is a good companion metric.

## Compactness Metrics

### Standard Options

| Metric | Formula | Requires coordinates? |
|---|---|---|
| Polsby-Popper | 4π × Area / Perimeter² | Yes |
| Reock | Area / Area(min bounding circle) | Yes |
| Convex Hull ratio | Area / Area(convex hull) | Yes |
| **Cut-edge score** | Count of inter-district adjacency edges | **No — graph only** |
| **Fraction Kept** | (Total edges − cut edges) / Total edges | **No — graph only** |
| Log Spanning Tree | log(# spanning trees in district subgraph) | **No — graph only** |

### Recommendation: Fraction Kept

**Use Fraction Kept (cut-edge fraction) as the primary compactness score.**

Rationale:

1. On a hex grid, every hex has up to 6 neighbors. Fraction Kept = (edges entirely within
   districts) / (total possible edges). A compact blob scores high; a snaking arm scores low.
   No geographic coordinates needed.
2. Duchin et al. (arXiv:1808.05860) argues explicitly that graph-based compactness metrics
   are coordinate-free, resolution-independent, and avoid the coastline-perimeter problem.
3. The score is transparent: "X% of your hex borders are within districts; Y% are district
   boundaries." Legible without a math background.

**Display guidance:** Show fraction-kept as a 0–100% "compactness score." A reference baseline
(the score of the scenario's "ideal neutral map") lets players calibrate.

## Per-Scenario Metric Requirements

| Scenario Type | Primary Metrics | Secondary / Diagnostic |
|---|---|---|
| Partisan gerrymander — Pack | Efficiency gap, seat share vs. vote share | District vote margins, mean-median diff |
| Partisan gerrymander — Crack | Efficiency gap, seat share vs. vote share | District vote margins, mean-median diff |
| Pack + Crack combined | Efficiency gap, seat share, competitive seat count | Wasted-vote breakdown per district |
| Majority-minority district (VRA) | Minority demographic % in district (VAP), preferred-candidate win/loss | Contiguity check, compactness |
| Neutral / good-government map | Compactness (fraction-kept), population balance (max deviation %), contiguity | Efficiency gap (should be ~0), competitive seat count |
| Incumbency protection | Competitive seat count (margin < 10%), safe seat count | Efficiency gap (bipartisan protection ≠ partisan gerrymander) |

### Notes

**VRA scenario:** Real VRA Section 2 analysis uses CVAP. For the game, total population
percentage is a reasonable proxy. Legal standard is >50% minority CVAP (*Bartlett v. Strickland*,
2009). Game can use >50% of total minority population and note the CVAP nuance in scenario text.

**Population balance:** For state legislative districts, legal safe harbor is ±5% from ideal
(10% total range; *Brown v. Thomson*, 1983). Congressional districts must be nearly exactly
equal. Equal hex count per district enforces exact balance if each hex has equal population.

**Contiguity:** Should be a hard constraint, not a metric. Non-contiguous districts should be
rejected outright (error state), not scored. Connected-components check on the hex adjacency
graph is trivial to implement.

**Competitive seat count threshold:** Use district vote margin < 10 percentage points = competitive
(aligns with Princeton's 46.5–53.5% vote share definition). Apply consistently across all scenarios.

## Gaps and Recommendations

1. **Mean-median difference is missing from the current metric plan.** Add it as a second partisan
   fairness number for packing/cracking scenarios. Easier to explain than efficiency gap.

2. **Competitive seat count is underspecified.** Define threshold explicitly: district vote margin
   < 10 percentage points = competitive. Apply consistently.

3. **Wasted-vote breakdown display.** For pack/crack scenarios, show a per-district "wasted votes"
   table alongside the aggregate efficiency gap. Makes the mechanism legible.

4. **VRA scenario needs a "cohesion" note.** *Gingles* requires not just majority-minority status
   but that the minority votes cohesively and faces racially polarized opposition. Scenario text
   should mention this so players understand they are meeting one of three Gingles preconditions.

5. **Incumbency protection is structurally different from partisan gerrymander.** A bipartisan
   protection map has a low efficiency gap but also low competitive seat count. Display both
   metrics side-by-side for that scenario to make the contrast explicit.

6. **No scenario currently teaches proportional representation as a foil.** An optional advanced
   scenario comparing FPTP outcomes to a hypothetical PR outcome could be a good post-v1 addition.

## Sources

- [Efficiency Gap — Wikipedia](https://en.wikipedia.org/wiki/Efficiency_gap)
- [How the Efficiency Gap Standard Works — Brennan Center](https://www.brennancenter.org/sites/default/files/legal-work/How_the_Efficiency_Gap_Standard_Works.pdf)
- [Partisan Gerrymandering and the Efficiency Gap — Stephanopoulos & McGhee, U Chicago Law](https://chicagounbound.uchicago.edu/cgi/viewcontent.cgi?article=1946&context=public_law_and_legal_theory)
- [PlanScore :: Efficiency Gap](https://planscore.org/metrics/efficiencygap/)
- [Dave's Redistricting App — Wikipedia](https://en.wikipedia.org/wiki/Dave's_Redistricting)
- [Election Composites (DRA methodology) — Alec Ramsay / Medium](https://medium.com/dra-2020/election-composites-13d05ed07864)
- [Princeton Gerrymandering Project — Redistricting Report Card Methodology](https://gerrymander.princeton.edu/redistricting-report-card-methodology/)
- [Measures of Compactness — redistmetrics R package vignette](https://cran.r-project.org/web/packages/redistmetrics/vignettes/compactness.html)
- [Discrete Geometry for Electoral Geography — Duchin et al., arXiv:1808.05860](https://ar5iv.labs.arxiv.org/html/1808.05860)
- [Why Precinct-Level Election Results Matter — MIT Election Lab](https://electionlab.mit.edu/sites/default/files/2023-11/Precinct_primer.pdf)
- [Gerrymandering with Differential Turnout — NBER w31442](https://www.nber.org/system/files/working_papers/w31442/revisions/w31442.rev1.pdf)
- [Don't Trust a Single Gerrymandering Metric — arXiv:2409.17186](https://arxiv.org/html/2409.17186v1)
- [VRA Majority-Minority Districts: Why CVAP Is Key — WA Community Alliance](https://wacommunityalliance.org/majority-minority-districtswhy-cvap-is-key-to-voting-rights/)
