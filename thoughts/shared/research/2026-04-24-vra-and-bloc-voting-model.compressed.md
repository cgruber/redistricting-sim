<!--COMPRESSED v1; source:2026-04-24-vra-and-bloc-voting-model.md-->
§META
date:2026-04-24 researcher:claude(web-search-researcher) branch:main repo:cgruber/redistricting-sim
topic:vra-and-bloc-voting-model
tags:VRA,voting-rights-act,majority-minority,bloc-voting,demographic-modeling status:complete

§ABBREV
VRA=Voting Rights Act VAP=voting-age-population CVAP=citizen-voting-age-population
RPV=racially-polarized-voting MMD=majority-minority-district

§SUMMARY
Legal floor for MMD: >50% minority VAP (Bartlett v. Strickland 2009). Practical effective
threshold often 55–60%+ due to turnout/registration/crossover. Game's proposed bloc voting
model (group vote-share % × population weight → district outcome) is correct abstraction.
Use VAP for game (no citizenship modeling); explain CVAP in scenario text. VRA risk indicator:
minority ≥30% VAP but <50% AND preferred candidate loses.

§LEGAL
Gingles test (Thornburg v. Gingles 1986) — all 3 required:
  I: minority sufficiently large+compact to be majority in a single-member district
  II: minority politically cohesive (votes for same candidates)
  III: majority votes as bloc, usually defeating minority's preferred candidate
Even if all 3 met → "totality of circumstances" still applies
Bartlett v. Strickland (2009): Gingles I only satisfied if minority >50% VAP

§VAP_vs_CVAP
VAP: all adults 18+; from Census; includes non-citizens
CVAP: citizens 18+; from ACS; excludes non-citizens
Why matters: Latino/Asian communities → VAP overestimates eligible electorate
  55% VAP → may be 45% CVAP if citizenship rates are low; courts use CVAP for these groups
Game: use VAP (no citizenship modeling); explain CVAP gap in scenario tooltip/framing

§PRACTICAL_THRESHOLDS
Legal floor: 50%+1 VAP (no higher floor mandated)
Practice: 55% (Virginia); 60–70% (Alabama) — political/practical judgments not law
Ceiling: cannot pack beyond demonstrably necessary → racial gerrymander risk (ALBC v. Alabama 2015)

§BLOC_VOTING_MODEL
RPV legal definition = Gingles II (minority cohesion) + Gingles III (majority bloc defeats minority)
Methods IRL: homogeneous precinct analysis | ecological regression | ecological inference (EI)
Game abstraction: each group has vote_share_dem per precinct; district = population-weighted avg
Assessment: CORRECT — captures cohesion, weighted outcome, bloc-defeat mechanism

Precinct data schema:
  total_population: int
  demographics[]:
    group_id: string
    population_share: float   # sum=1.0
    vap_share: float          # approx = population_share for v1
    vote_share_dem: float
    vote_share_rep: float     # = 1 − vote_share_dem

District outcome formula:
  dem_votes = Σ_p [ pop[p] × Σ_g (share[p][g] × vote_d[g]) ]
  dem_share = dem_votes / total_dist_pop

§VRA_RISK_INDICATOR
Per district, per group:
  minority_vap_share[g] = Σ_p(pop[p]×vap_share[p][g]) / total_dist_pop
HIGH risk: minority_vap_share ≥ 0.30 AND <0.50 AND preferred-cand loses
SAFE: minority_vap_share ≥ 0.50 AND preferred-cand wins
UI text: "Latino voters are X% of this district. Their preferred candidate is [winning/losing].
  [If losing: This may represent vote dilution under the VRA.]"

§SOUNDNESS
Existing games (USC ReDistricting Game, GameTheory GerryMander): simpler than proposed model;
  proposed game is more sophisticated and educationally superior

Oversimplification risks:
  1. vote_share=100% → teaches 50%+1=win (false); use realistic sub-100% vote shares
  2. no turnout differentials → overstates minority power; note assumption; deferred to later scenario
  3. no proportional rep guarantee; frame as "meaningful opportunity" not "fair share"
  4. CVAP gap → note in scenario text for Latino scenario
  5. Gingles totality-of-circumstances → don't imply VRA mechanically requires MMD

§FRAMING
Scenario intro: "...Latino population growth has made a majority-Latino district geographically
  possible. Your task: draw districts that preserve or create that opportunity. [CVAP note: courts
  typically examine CVAP; this scenario uses population share as a proxy.]"
VRA risk indicator: "Warning: large minority present but not a majority. Cohesive voting faces bloc
  opposition — preferred candidates unlikely to win. Pattern can constitute vote dilution."
General caveat: "Simplified demographic models for illustration. Real VRA compliance requires
  legal analysis + RPV statistical testing. This game builds intuition, not legal expertise."

§REFS
Gingles: en.wikipedia.org/wiki/Thornburg_v._Gingles
LII VRA racial vote dilution: law.cornell.edu/constitution-conan/...
RPV: redistrictingdatahub.org/resources/racially-polarized-voting/
CVAP: census.gov/programs-surveys/decennial-census/about/voting-rights/cvap.html
Brennan Center computational redistricting + VRA: brennancenter.org/...
NAACPLDF VRA primer: naacpldf.org/wp-content/uploads/LDF-Sections-2-and-3c-VRA-primer-1.5.21.pdf
Democracy Docket racial gerrymandering vs dilution: democracydocket.com/analysis/...
