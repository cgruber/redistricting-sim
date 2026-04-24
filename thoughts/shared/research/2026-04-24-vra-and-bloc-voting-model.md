---
date: 2026-04-24
researcher: claude (web-search-researcher)
branch: main
repository: cgruber/redistricting-sim
topic: vra-and-bloc-voting-model
tags: VRA, voting-rights-act, majority-minority, bloc-voting, demographic-modeling
status: complete
last_updated: 2026-04-24
last_updated_by: claude
---

## Summary

A majority-minority district under VRA Section 2 requires a minority group to constitute more
than 50% of the voting-age population (VAP) in a single-member district, as established by
*Thornburg v. Gingles* (1986) and confirmed by *Bartlett v. Strickland* (2009). The game's
proposed bloc voting model — assigning each demographic group a vote-share percentage per
precinct and computing district outcome as a weighted average by group population — **is the
correct abstraction and is educationally sound**. For fictional precincts with no citizenship
modeling, VAP is the appropriate and sufficient denominator; CVAP should be explained in
scenario framing as a real-world nuance.

## Legal Definition: Majority-Minority District

### The Gingles Three-Prong Test

*Thornburg v. Gingles*, 478 U.S. 30 (1986) established that to prove vote dilution under
VRA Section 2, plaintiffs must satisfy all three preconditions:

1. **Compactness/Size (Gingles I)**: The minority group is "sufficiently large and geographically
   compact to constitute a majority in a single-member district."
2. **Political Cohesion (Gingles II)**: The minority group is "politically cohesive" — members
   vote similarly for the same candidates.
3. **Majority Bloc Voting (Gingles III)**: "The majority votes sufficiently as a bloc to enable
   it ... usually to defeat the minority's preferred candidate."

Even if all three prongs are met, plaintiffs must further show under the "totality of
circumstances" that the redistricting plan dilutes minority voting strength. The three Gingles
preconditions are necessary but not sufficient.

### The 50%+1 Threshold

*Bartlett v. Strickland*, 556 U.S. 1 (2009) clarified that the first Gingles prong can only be
satisfied if the minority group constitutes **more than 50% of the voting-age population** in the
proposed district.

**The legal floor is 50%+1 of VAP.** There is no single legally mandated higher threshold.
However in practice:
- Virginia's legislature relied on a 55% African-American threshold as "necessary" for effective
  representation. Alabama drew districts over 60–70% African-American.
- These higher thresholds (55%, 60%+) are practical/political judgments, not legal mandates.
- States cannot use VRA as a pretext to pack minorities beyond what is demonstrably necessary —
  that itself constitutes racial gerrymandering (*Alabama Legislative Black Caucus v. Alabama*, 2015).

### CVAP vs. VAP

**VAP (Voting Age Population)**: All persons 18+, regardless of citizenship. From decennial Census.

**CVAP (Citizen Voting Age Population)**: Persons 18+ who are U.S. citizens, therefore eligible
to vote. From the American Community Survey (ACS). Excludes non-citizens.

**Why it matters**: For communities with high non-citizen populations (particularly Latino
communities), VAP can significantly overstate the actual eligible electorate. A district that is
55% Latino by VAP might be only 45% Latino by CVAP. Courts have found CVAP is the more
appropriate measure when evaluating VRA compliance for groups where non-citizen membership
is substantial.

**For the game**: VAP is the correct and sufficient measure to implement since fictional
precincts have no separate citizenship modeling. Scenario text should explain the CVAP nuance.

## Bloc Voting Model

### Legal/Operational Definition

"Racially polarized voting" (RPV) is the legal term of art:
- The minority group votes cohesively for its preferred candidate (Gingles II).
- The majority also votes as a bloc in a way that typically defeats the minority's preferred
  candidate (Gingles III).

Statistical methods used in real RPV analysis:
- **Homogeneous precinct analysis**: Compare nearly all-minority vs. all-majority precincts.
- **Ecological Regression (ER)**: Bivariate regression of minority share against candidate
  vote share across precincts.
- **Ecological Inference (EI)**: Bounds-based and maximum-likelihood method; most accurate
  for making individual-level inferences from aggregate data.

### Assessment of the Proposed Game Abstraction

The game proposes: each precinct stores a demographic breakdown (e.g., 40% Latino, 60% Anglo),
and each demographic group has a vote-share parameter (e.g., Latino voters: 70% D / 30% R;
Anglo voters: 45% D / 55% R). District outcome is a population-weighted average.

**This is the right abstraction.** It correctly captures:
- Group-level voting preferences (cohesion)
- That district outcome is determined by the population-weighted mix of groups
- That a minority group's preferred candidate can lose even if voting cohesively, if the majority
  group is larger and votes oppositely (the bloc voting defeat mechanism)

Acceptable simplifications: ecological inference complexity, turnout differentials by group,
registration rates, and non-citizen population effects.

## Recommended Game Model

### Data Fields Per Precinct

```
precinct:
  total_population: int
  demographics:
    - group_id: string           # e.g. "latino", "anglo", "black"
      population_share: float    # fraction of total population, sum = 1.0
      vap_share: float           # fraction of VAP (can approximate = population_share)
      vote_share_dem: float      # fraction of this group's votes going to Dem candidate
      vote_share_rep: float      # = 1.0 - vote_share_dem (two-party simplification)
```

### Formula for District Election Outcome

Given a district of precincts P, with each precinct p having `pop[p]`, `share[p][g]`, `vote_d[g]`:

```
district_dem_votes = Σ_p [ pop[p] × Σ_g (share[p][g] × vote_d[g]) ]
district_total_pop = Σ_p pop[p]
district_dem_share = district_dem_votes / district_total_pop
```

This is exactly the weighted-average formula the game vision describes, and it is correct.

### VRA Risk Indicator Definition

For each district, compute minority VAP share per group:

```
district_minority_vap_share[g] = Σ_p (pop[p] × vap_share[p][g]) / district_total_pop
```

**VRA Risk = HIGH** if:
- A minority group has `district_minority_vap_share >= 0.30` (large enough to matter) AND
- `district_minority_vap_share < 0.50` (not yet a majority) AND
- The group's preferred candidate would lose the district election

**VRA Safe = GREEN** if:
- A minority group constitutes >= 50% of VAP in the district AND
- The group's preferred candidate wins the district election

**Framing for UI**: "Latino voters are [X%] of this district's population. Their preferred
candidate is [winning/losing]. [If losing: This may represent vote dilution under the VRA.]"

### Whether to Model CVAP Separately

**Recommendation: Do not model CVAP as a separate field in v1.** The educational distinction
is important enough to explain in a tooltip or scenario briefing, but adding a separate
citizenship-rate parameter per demographic group adds complexity without improving the core
educational lesson.

## Educational Soundness Assessment

### Existing Tools and Their Approach

The ReDistricting Game (USC, 2007) includes Mission Four on majority-minority districts.
It teaches players to concentrate minority voters to form a majority-minority district but
"vastly oversimplifies, ignoring critical things like geography and population density."

GerryMander (GameTheory) demonstrates packing/cracking but does not model demographic
vote-share parameters.

Academic tools (MGGG, Princeton Gerrymandering Project) use full ensemble methods and CVAP
data but are research tools, not educational games.

**The proposed game's model is more sophisticated than existing educational games** in its
explicit group-level vote share modeling — an improvement over the prior art.

### Risks of Oversimplification

1. **Conflating demographic majority with electoral majority**: If group vote-share is always
   100%, the game will teach that 50%+1 = guaranteed win, which is false. Use realistic
   sub-100% vote shares and note the practical 55–60%+ threshold.

2. **Omitting turnout differentials**: Groups with lower registration/turnout need a higher
   demographic share to translate numbers into electoral success. Acceptable for v1 but should
   be noted in scenario text. A later scenario could introduce turnout variation as its teaching
   point.

3. **Teaching that VRA creates proportional representation rights**: The law explicitly does
   not guarantee this. Frame as: "a meaningful opportunity to elect a candidate of their choice"
   — never as "fair share of seats."

4. **The CVAP gap**: For the Latino scenario, explain that 51% VAP may be insufficient in
   practice; courts look at CVAP. A scenario note should mention this.

5. **Missing "totality of circumstances" nuance**: A district can satisfy all three Gingles
   prongs and still not require a majority-minority district. Framing should not imply VRA
   mechanically requires a majority-minority district wherever a minority group is large enough.

### Recommended Framing Language

**For "A Voice for the Valley" scenario:**

> "Under the Voting Rights Act, if a minority community is large enough and votes cohesively,
> mapmakers may be required to draw a district where they form a voting majority — giving them
> a meaningful chance to elect a representative of their choice. In this scenario, Latino
> population growth has made a new majority-Latino district geographically possible. Your task
> is to draw districts that preserve or create that opportunity. [Note: In real redistricting,
> courts typically examine the Citizen Voting Age Population — adults who are eligible to vote —
> not just total population. For this scenario, population share is used as a simplified proxy.]"

**For VRA risk indicators in the live UI:**

> "Warning: A large minority population is present in this district but does not form a voting
> majority. If this group votes cohesively and faces bloc opposition, their preferred candidates
> are unlikely to win. This pattern can constitute vote dilution under the VRA."

**General educational caveat (about page or scenario intro):**

> "This game uses simplified demographic models to illustrate redistricting concepts. Real-world
> VRA compliance involves detailed legal analysis, statistical testing for racially polarized
> voting, and review of historical electoral outcomes. This game is intended to build intuition,
> not to substitute for legal expertise."

## Sources

- [Thornburg v. Gingles — Wikipedia](https://en.wikipedia.org/wiki/Thornburg_v._Gingles)
- [Racial Vote Dilution and Racial Gerrymandering — LII / Legal Information Institute](https://www.law.cornell.edu/constitution-conan/amendment-14/section-1/racial-vote-dilution-and-racial-gerrymandering)
- [Racially Polarized Voting — Redistricting Data Hub](https://redistrictingdatahub.org/resources/racially-polarized-voting/)
- [Section 2 of the Voting Rights Act — Law Forward](https://www.lawforward.org/section-2-of-the-voting-rights-act/)
- [Congressional Redistricting 2021: Legal Framework — Congress.gov CRS](https://www.congress.gov/crs_external_products/LSB/HTML/LSB10639.web.html)
- [Citizen Voting Age Population (CVAP) — U.S. Census Bureau](https://www.census.gov/programs-surveys/decennial-census/about/voting-rights/cvap.html)
- [Breaking Down the Supreme Court's VRA Decision Out of Alabama — Democracy Docket](https://www.democracydocket.com/analysis/breaking-down-the-supreme-courts-voting-rights-act-decision-out-of-alabama/)
- [VRA Majority-Minority Districts: Why CVAP Is Key — WA Community Alliance](https://wacommunityalliance.org/majority-minority-districtswhy-cvap-is-key-to-voting-rights/)
- [Racial Gerrymandering vs. Racial Vote Dilution, Explained — Democracy Docket](https://www.democracydocket.com/analysis/racial-gerrymandering-vs-racial-vote-dilution-explained/)
- [Computational Redistricting and the Voting Rights Act — Brennan Center](https://www.brennancenter.org/sites/default/files/2023-11/Computational%20Redistricting%20and%20the%20Voting%20Rights%20Act%20FINAL%20PUBLISHED%20VERSION%20elj.2020.0704.pdf)
- [The ReDistricting Game — USC Game Innovation Lab](https://www.socialstudies.org/social-education/74/5/redistricting-game-teaching-congressional-gerrymandering-through-online)
- [Princeton Gerrymandering Project — Redistricting Report Card Methodology](https://gerrymander.princeton.edu/redistricting-report-card-methodology/)
- [NAACPLDF — Sections 2 and 3c VRA Primer](https://naacpldf.org/wp-content/uploads/LDF-Sections-2-and-3c-VRA-primer-1.5.21.pdf)
