<!--COMPRESSED v1; source:2026-04-24-election-simulation-and-evaluation-metrics.md-->
§META
date:2026-04-24 researcher:claude(web-search-researcher) branch:main repo:cgruber/redistricting-sim
topic:election-simulation-and-evaluation-metrics
tags:election-simulation,fptp,efficiency-gap,compactness,gerrymandering-metrics status:complete

§ABBREV
EG=efficiency-gap MM=mean-median-difference FK=fraction-kept(compactness)
DRA=Dave's Redistricting App

§SUMMARY
Spike FPTP model is correct and matches DRA/PlanScore approach. EG formula is well-defined
(±7% threshold) but must be paired with MM-difference and compactness to avoid single-number
blindspots. For hex-grid: use Fraction Kept (graph-topology compactness) — coordinate-free,
principled, legible. Contiguity = hard constraint (error state), not a metric.

§FPTP_MODEL
Formula: sum precinct party vote shares within district; plurality winner takes seat — CORRECT
Acceptable simplifications: fixed vote shares; fixed turnout; no candidate quality effects
DRA uses composite VPI across multiple elections; PlanScore closest to spike model
Fixed turnout is more consequential than fixed vote shares — document as assumption in scenarios
Later scenario opportunity: introduce turnout variation as its own teaching point

§EG
Wasted votes per district:
  loser: all votes wasted
  winner: votes > floor(total/2)+1 wasted
EG = (WastedA − WastedB) / TotalVotes
Simplified (equal-pop districts, valid for hex grid):
  EG = (SeatMargin − 50%) − 2×(VoteMargin − 50%)
Thresholds: <7% neutral | 7–15% significant | >15% extreme
Limitation: conflates packing+cracking; landslide-sensitive → pair with MM-difference

§MM_DIFFERENCE
mean party vote share across districts − median party vote share
Easier to explain than EG; used by Princeton Gerrymandering Project
"Your party's median district leans farther than average = districts are packed"
ADD to metric set (currently missing from game vision)

§COMPACTNESS
Recommendation: Fraction Kept (FK) = (intra-district edges) / (total graph edges)
Coordinate-free; resolution-independent; avoids coastline problem (Duchin et al 1808.05860)
Display as 0–100% score; compare vs scenario's "neutral reference map"
Polsby-Popper/Reock: require real coordinates; save for later if real geodata added

§CONTIGUITY
Hard constraint not metric; non-contiguous → error state (not scored)
Connected-components check on hex adjacency graph; trivial to implement

§PER_SCENARIO_METRICS
pack/crack: EG + seat/vote share + MM-diff; secondary: per-dist wasted votes breakdown
majority-minority VRA: minority VAP% + preferred-cand win/loss; secondary: contiguity+compactness
neutral/good-gov: FK compactness + pop balance (max dev%) + contiguity; secondary: EG≈0 + competitive count
incumbency: competitive seat count (margin<10%) + safe count; secondary: EG (bipartisan ≠ partisan)

Competitive threshold: district vote margin <10pp = competitive (Princeton: 46.5–53.5%)
Pop balance: ±5% safe harbor (state leg); equal hex count = exact balance if equal-pop hexes

§GAPS
  MM-difference missing from vision — add
  Competitive threshold undefined — define as <10pp
  Per-dist wasted-vote breakdown display (pack/crack scenarios)
  VRA scenario: note Gingles has 3 prongs; game only checks prong I (size)
  Incumbency scenario: show EG+competitive side-by-side (low EG ≠ fair)

§REFS
EG formula: Stephanopoulos+McGhee chicagounbound.uchicago.edu/.../1946
EG thresholds: planscore.org/metrics/efficiencygap/
Compactness options: redistmetrics cran vignette
Duchin hex geometry: ar5iv.labs.arxiv.org/html/1808.05860
Don't trust single metric: arxiv.org/html/2409.17186v1
DRA methodology: medium.com/dra-2020/election-composites-...
