<!--COMPRESSED v1; source:2026-06-30-gerrymandering-metrics-audit.md-->
§META
date:2026-06-30 researcher:Claude(Opus4.8)+cgruber commit:042f052678d4 branch:main
repo:cgruber/redistricting-sim topic:domain-expert audit of gerrymandering fairness metrics vs canonical defs
tags:[audit,simulation,metrics,efficiency-gap,mean-median,compactness,VRA,pedagogy] status:complete

§ABBREV
EG=efficiency-gap MM=mean-median 2p=two-party VAP=voting-age-pop CVAP=citizen-VAP PP=Polsby-Popper

§WHY
2026-06-27 code review's completeness-critic: all that work audited "does code do what it intends", none "is intent correct". For an EDUCATIONAL sim the load-bearing Q is whether the fairness METRICS are correct + pedagogically faithful. A wrong EG denominator or flipped MM sign passes every unit test yet mis-teaches.

§METHOD
read impl(evaluate.ts, election.ts, validity.ts, adapter.ts) precisely + independently gathered canonical reference defs from primary lit (S&M 2015; McDonald&Best 2015; DeFord&Veomett Bounds-and-Bugs 2024; PlanScore; Princeton GP; Brennan; DOJ Section2; MGGG cut-edges; PP/Reock). Compared formula/denominator/normalization/sign/pedagogy.

§HEADLINE (reassuring)
CORE MATH IS SOUND. EG wasted-vote formula = academic standard; MM (field's MOST error-prone metric — naive impls routinely mis-label sign, per Bounds-and-Bugs) has the CORRECT sign for its convention. Completeness-critic's worst case (silently-wrong formulas) does NOT materialize.
Real gaps = pedagogical fidelity + 3rd-party/turnout robustness, NOT wrong arithmetic:
1 majority-minority uses raw POPULATION share not VAP/CVAP — the one substantive gap, on the VRA lesson
2 EG + MM not 2p-normalized — moot today (L/G/I always 0) but not robust
3 labeling: "compactness"=cut-edges (legit, not PP shape metric); EG 0.10-0.15 + safe/competitive thresholds are game-calibrated not canonical
4 uniform turnout (turnout_rate loaded but deliberately unused, adapter.ts:113)

§FINDINGS
1 EG (evaluate.ts:251-281): impl winner-wasted=max(0,V−total×0.5), loser=all, EG=(Rw−Dw)/ΣVtotal, tests |EG|≤thr(0.10-0.15). REF(S&M): winner=V−total/2 ✓(max(0,) is safe superset), loser=all ✓, denom=total but computed on 2p (exclude 3rd parties num+denom), positive disadvantages first party, equal-turnout shortcut EG=S*−2V* exact. VERDICT: formula CORRECT. 2 deviations moot at strict-2p: (a) denom sums Vtotal incl 3rd-party while wasted only R/D; (b) ×0.5 win-line assumes 2p majority — a plurality winner <50% would get wasted=0. sign correct + uses abs → symmetric gate. thr 0.10-0.15 LENIENT vs S&M ~0.08. REC: compute on 2p (Vtotal=R+D) or comment the assumption; present thr as game-calibrated.
2 MM (evaluate.ts:283-307): impl diff=mean−median of raw district shares, SIGNED, label positive=disadvantaged/packed. REF: 2 conventions — A(median−mean; McDonald&Best/PlanScore) positive FAVORS; B(mean−median; Princeton/DRA) positive DISADVANTAGES. norm=2p share. VERDICT: impl=Convention B and LABEL IS CORRECT (positive mean−median=disadvantaged/packed) — genuinely good, Bounds-and-Bugs documents naive mean−median code is usually mis-labeled and this codebase avoided it. minor: raw share not 2p (moot at 2p). NUANCE: scenario-004(Lakeview, Ken wins all 5) uses mean_median(ken)≤0.1 on SIGNED value → only fails if Ken packed; defensible (rewards efficient uniform cracking) but REPURPOSES a symmetry metric as a one-sided win-efficiency gate. REC: 2p-normalize; note convention(A is "original", PlanScore=opposite sign); optional tooltip that scenario-004 gates win-efficiency not fairness.
3 compactness (evaluate.ts:80-108): impl = fraction of a district's hex edges that are interior. REF: this IS cut-edges compactness (Duchin/MGGG), a real measure, discrete analog of PP on uniform grid — NOT shape-based PP(4πA/P²)/Reock. VERDICT: correct+legit, only issue is NAMING (learner may conflate with court-cited shape metrics). REC: label as grid/cut-edges proxy. low.
4 majority-minority (evaluate.ts:309-324) ← SUBSTANTIVE GAP: impl counts districts where group POPULATION share ≥ min_eligible_share. REF(Gingles/Bartlett/DOJ): needs 50%+1 of VOTING-ELIGIBLE pop (VAP/CVAP); total pop is for equal-pop ONLY, not M-M threshold. VERDICT: the one real pedagogical/legal fidelity gap, on the VRA lesson (GAME-078 set); runtime has no VAP/CVAP field. REC: add eligible-pop fraction per group, OR make copy explicit it's population share vs the CVAP legal test. MEDIUM.
5 seat/safe/competitive (evaluate.ts:226-249): seat_count from seatsByParty ✓; safe=won w/ margin≥thr; competitive=margin≤thr; margin=winner−runnerup share (2p victory margin)✓. REF: no canonical numeric cutoffs (Cook/Sabato qualitative); ~<10pt competitive, >20pt safe. VERDICT: sound, thresholds per-scenario configurable=right design, just game-chosen. REC: present as game-calibrated. low.
6 population_balance (validity.ts:60-69): per-district (pop−ideal)/ideal vs ±tolerance = one-person-one-vote; per-district check is a clean (stricter) form of overall-range. CORRECT.
7 turnout (adapter.ts:113): votes=partyShare×population, turnout_rate loaded but unused ("until Sprint 3"). implies EG wasted-vote ≡ 2-1 shortcut exactly (equal turnout = shortcut's exact-equivalence condition); can't yet teach turnout-driven effects; all metrics on population-weighted votes. known reasonable v1 simplification. REC: re-verify EG/MM when turnout lands.

§RECS (priority)
1 majority-minority VAP/CVAP fidelity (MEDIUM — only substantive gap, VRA lesson)
2 2p-normalize EG+MM (low, robustness) + comment the strict-2p assumption
3 labeling/copy (low): compactness=cut-edges proxy; EG+safe/competitive thresholds game-calibrated; note MM convention B (PlanScore opposite sign)
4 MM one-sided use scenario-004: optional tooltip (gates win-efficiency not fairness)
5 turnout (low, forward-looking): re-verify EG/MM when turnout weighting lands

§TRIAGE
FIX-NOW: none — no wrong formulas; all items are enhancements.
FILE-TICKETS: majority-minority VAP/CVAP(1); 2p-normalize EG+MM(2); labeling/copy pass(3-4).
LEAVE: population_balance, seat_count, safe/competitive, compactness math (correct); turnout (acknowledged).

§REFS
EG: S&M 2015(UChiLRev); PlanScore/efficiencygap; Brennan(Petry); Veomett arXiv:1801.05301; Bernstein&Duchin arXiv:1705.10812; Sabato Crystal Ball. MM: McDonald&Best 2015(ELJ); PlanScore/meanmedian; Princeton GP methodology; DeFord&Veomett Bounds-and-Bugs arXiv:2406.12167; Dave's Redistricting App. compactness: MGGG cut-edges(Duchin Political Geometry ch1); redistmetrics(ALARM); PP/Reock. maj-min: Gingles 1986; Bartlett v Strickland 2009; DOJ Section2 2024; Census CVAP. safe/comp: Cook PVI; Brennan; 45-55% competitive band. symmetry: Gelman-King bias; DeFord Implementing-Partisan-Symmetry MGGG 2020.
