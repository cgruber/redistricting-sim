<!--COMPRESSED v1; source:2026-05-02-design-001-achievement-star-system.md-->
§META date:2026-05-02 ticket:DESIGN-001 status:accepted researcher:agent topic:achievement-star-system tags:game-design,ux,scoring

§ABBREV
sc=SuccessCriterion req=required:true opt=required:false

§SUMMARY
Recommend variable per-criterion stars; no format change needed. 1 base star (all $req pass) + 1 per $opt criterion passed. Campaign total = sum stars earned / sum stars available. Rejected fixed-3 (arbitrary tier boundary, implies $opt hierarchy). Rejected pure badges (no campaign hook).

§FINDINGS
Angry Birds/Cut the Rope: fixed-3 star, single performance axis — works because $opt objectives same axis as $req.
Monument Valley: no stars — appropriate for art game, wrong for educational game w/ explicit learning goals.
Zachtronics histograms: multi-metric continuous optimization — inapplicable; PtP criteria are boolean not continuous.
Khan Academy/Duolingo: binary completion + separate XP/badges; no per-exercise star count.
Research (Blair, Game Developer): measurement achievements (variable stars) > completion achievements (binary) for educational contexts; achievements should focus attention on learning strategies not artificial incentives.

§MODELS
A fixed-3-tier: "some optional" undefined for variable $opt counts; collapses when 1 $opt; implies $opt hierarchy; needs weight/tier field → format change → rejected
B N/M campaign: consequence of per-scenario model not itself a model; adopted as aggregate layer
C per-criterion badges only: educationally accurate; no campaign hook; partially adopted

§RECOMMENDATION
Variable per-criterion stars.
1 base star: all $req criteria pass
+1 star per $opt criterion that passes
scenario max = 1 + count($opt criteria)
campaign progress = sum(earned) / sum(max) across scenarios
Steam achievements = separate campaign milestone layer; not 1:1 with per-scenario $opt criteria; don't let Steam 100-achievement cap constrain per-scenario design

§FORMAT_CHANGES
None. req:boolean already encodes all needed info.
Engine: base=(all $req pass ? 1 : 0); bonus=count(passing $opt); total=base+bonus; max=1+count($opt)
New data in player save state only (criteria_passed: Set<CriterionId>), not scenario format.

§REFS
ADR:thoughts/shared/decisions/2026-04-24-scenario-data-format.md — SuccessCriterion schema (required:boolean)
Research:2026-05-02-design-001-achievement-star-system.md — full findings
