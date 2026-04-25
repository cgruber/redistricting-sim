<!--COMPRESSED v1; source:2026-04-24-scenario-data-format.md-->
§META
date:2026-04-24 status:accepted — pending sprint-1 feedback
topic:scenario data format spec — gate before simulation implementation

§ABBREV
pc=precinct dist=district ET=election-type grp=group grps=groups
PartyId=PartyId GroupId=GroupId DistId=DistrictId PcId=PrecinctId
v1=version 1

§PURPOSE
Self-contained per-scenario JSON doc; no runtime external lookups
Serves: pre-built authoring | sim engine | future player/community scenarios
Deterministic: same file + same map → same sim result
  v2 planned: ensemble/Monte Carlo comparison runs as separate analytical layer against same deterministic sim (see election-simulation ADR Decision 1)
format_version:"1" required; parser rejects unknown versions

§TOP_LEVEL Scenario
```
format_version  "1"
id              ScenarioId
title           string
election_type   "congressional"|"state_senate"|"state_house"
region          RegionSpec
geometry        GeometrySpec
parties         Party[]          min 2; fictional names
districts       District[]       defines target $dist set; count = num to draw
precincts       Precinct[]       editable + context $pcs
group_schema?   GroupSchema      optional dimensional schema
default_district_id? DistId       auto-fill target for unassigned editable $pcs; default districts[0]
events          DemographicEvent[]  fire at evaluation time
rules           ScenarioRules
success_criteria SuccessCriterion[]
narrative       Narrative
state_context?  StateContext     pre-computed other-region results ($v1: optional/ignored)
```

§GEOMETRY
hex_axial: $pc.position={q,r}; adjacency derived (all 6 neighbors); neighbors field absent
custom: $pc.position={x,y}; $pc.neighbors[] REQUIRED; adjacency must be symmetric
v1: hex_axial only; custom defined now to avoid breaking format change later

§PRECINCT
Note: map geography ADR declared neighboring_context_precincts[] as separate array; spec merges
editable+context $pcs into single precincts[] distinguished by editable bool. Deliberate
simplification: flat list easier to validate/index; semantic distinction preserved via flag.
```
id                PcId
editable          bool           false=context $pc (read-only; participates in sim)
county_id?        string         display only → county border overlay
position          HexAxialPos|CartesianPos
neighbors?        PcId[]         required for custom geometry only
total_population  int            non-negative
demographic_groups DemographicGroup[]  population_shares must sum to 1.0
initial_district_id? DistId|null  absent/null → auto-assign to districts[0] (editable $pcs only)
  // map-geo ADR runtime shape: pc.assignments:Map<ET,DistId>; format uses bare initial_district_id
  // because each scenario has one election_type; runtime engine maps into assignments slot at load
name?             string
tags?             string[]       for event PrecinctFilter
```

§DEMOGRAPHIC_GROUPS
$grp fields: id | name?(string,UI display label) | population_share[0,1] | vote_shares:Map<$PartyId,float>(sum=1.0; ALL parties)
  | turnout_rate[0,1] | dimensions?:Map<DimName,DimValue>(required if group_schema declared)
voter_eligible: NOT on $grp — derived from group_schema.eligibility_rules
voter_weight = total_population × population_share × voter_eligible × turnout_rate

GroupSchema(optional):
  dimensions: Map<DimName,DimValue[]>
  eligibility_rules: [{dimension, value, voter_eligible:false}]  // absent=eligible
  completeness constraint: if schema declared → every $pc must have one $grp per dim-value combo
    (zero population_share ok; enforces filter coherence + neutral symmetric modeling)

§EVENTS fire at evaluation; applied in order before sim runs
```
turnout_shift:    id | group_filter | magnitude(delta to turnout_rate; clamped[0,1])
vote_share_shift: id | group_filter | party:$PartyId | delta(renormalized after)
population_shift: id | precinct_filter | group_filter | delta(renormalized after)
```
GroupFilter: {group_ids:$GroupId[]} | {dimension,value}(requires schema)
PrecinctFilter: {precinct_ids:$PcId[]} | {tags:string[]}(ALL tags) | {editable_only:true}

§RULES_VS_CRITERIA
rules=hard validity constraints; illegal map→Test blocked
criteria=grading rubric; required→must pass to complete; optional→achievements/stars

§RULES
population_tolerance: float  ±fraction from ideal (congressional~0.001; state-leg~0.05)
contiguity: "required"|"preferred"|"allowed"
  // required(default): hard error; preferred: warning only; allowed: fully permitted (islands etc.)
compactness_threshold?: float  min Fraction Kept; absent=not enforced (still evaluated)

§CRITERIA SuccessCriterion: id | required:bool | description | criterion
```
seat_count:        party | operator(lt|lte|eq|gte|gt) | count
majority_minority: group_filter | min_eligible_share | min_districts
                   (uses voter-eligible pop; eligibility_rules define the denominator)
efficiency_gap:    operator | threshold
mean_median:       party | operator | threshold
compactness:       operator | threshold  (Fraction Kept metric)
safe_seats:        party | margin | min_count
competitive_seats: margin | min_count
population_balance: (no params; display hook for Test sequence)
district_count:    (no params; all districts[] non-empty+assigned; constitutional seat count)
```

§NARRATIVE
character: {name,role,motivation}  (player's framing; cast as specific actor)
intro_slides: [{heading?,body(markdown),image?}]
objective: string  (shown on map screen)
flavor_text?: string

§STATE_CONTEXT (v1: parsed but may be ignored by renderer)
state_name | total_districts | other_region_results:Map<RegionId,{district_count,seat_totals:Map<$PartyId,int>}>
live region results + sum(other) = statewide totals

§UNASSIGNED_PCS
absent/null initial_district_id → auto-assign to default_district_id (if set) else districts[0] (editable $pcs only)
partial assignments ok: unassigned $pcs → default_district_id (if set) else districts[0]
scenario wanting blank start: set all initial_district_id:null; narrative explains
initial assignments = starting point for player session state; simulate() receives CURRENT assignment map
runtime maintains assignment state separately; initial_district_id read once at scenario load

§VALIDATION invariants (must all hold)
1. All $PartyId refs exist in scenario.parties
2. All $DistId refs in initial_district_id exist in scenario.districts
3. All $GroupId refs in events/criteria exist in ≥1 $pc.demographic_groups
4. Every context $pc (editable:false) must have non-null initial_district_id; auto-fill to districts[0] applies only to editable $pcs
5. ∀$pc: sum(population_shares)==1.0 (±ε)
6. ∀$grp: sum(vote_shares)==1.0 (±ε); all scenario.parties present
7. If group_schema: ∀$pc has one $grp per dim-value combo; ∀$grp has value for every dim
8. hex_axial→no neighbors field; custom→neighbors present+symmetric
9. custom geometry: all $PcId values in neighbors[] must exist in scenario.precincts
10. districts.length ≥ 2 (scenario definition constraint; not player starting state)
11. All ids (EventId,CriterionId,PcId,DistId,GroupId,$PartyId) unique within scenario
12. precincts.length ≥ 1

§OPEN
1. [RESOLVED] CVAP/VAP: majority_minority uses voter-eligible pop; eligibility_rules are the mechanism; no explicit measure field needed
2. [RESOLVED] Event ordering: sequential (declaration order); overlapping shifts produce order-dependent results by design; document in authoring guidance
3. [RESOLVED] state_context in v1: included for forward compat; v1 renderer may ignore; no breaking change when v2 state-level view implemented; see OQ9
4. Narrative asset refs: relative path vs. asset key? Decide before pre-built authoring
5. [RESOLVED] auto-fill: added default_district_id? to scenario; falls back to districts[0]
6. [RESOLVED-PARTIAL] format_version:1 in spec; migration strategy deferred to v2 requirement
7. Context $pc non-editability = pedagogical simplification: real redistricting may require
   cross-boundary $pc adjustments for population balance; spec locks context $pcs as read-only
   ok for v1: (a) editable:false is per-$pc so scenario can override; (b) early scenarios simplified
   revisit if campaign/advanced scenarios need cross-boundary editing fidelity
8. Editor tools for blank-start: brush alone is poor for ~300 unassigned $pcs from scratch
   needed: flood-fill from seed | lasso+assign | generate valid starting partition
   UI/editor concern not format concern; track separately when approaching editor build
9. StateContext redesign: total_districts volatile; RegionResult concept unclear; redesign before $v1 impl; proposed: other_region_seat_totals:Record<PartyId,int>+state_total_districts:int
10. Achievement/star system: OQ; required:false criteria enable it; game ergonomics research needed before format extension; see DESIGN-001
