<!--COMPRESSED v1; source:2026-04-24-demographic-group-model.md-->
§META
date:2026-04-24 status:accepted
topic:demographic group model + voter eligibility architecture

§ABBREV
pc=precinct grp=group grps=groups ET=election-type
VRA=Voting Rights Act CVAP=citizen-voting-age-population
v1=version 1

§DECISIONS

1. $grps = named flat simulation units (not dimensional matrices)
  $grp fields: id(string) | population_share(float) | vote_shares:Map<PartyId,float> | turnout_rate(float)
  vote_shares REQUIRED for ALL $grps incl. ineligible (see §7)
  no fixed demographic vocabulary at engine level; $grp id = opaque scenario-defined string

2. Scenario-level dimensional schema + completeness constraint (optional)
  declare: scenario.group_schema.dimensions: Map<DimName, DimValue[]>
  completeness constraint (if schema declared):
    every $grp must declare a value for every declared dimension
    every combination of dim values must exist in every $pc (zero population_share ok)
  enforces: filter coherence + neutral treatment by construction
    race-only scenario with no citizenship dim → citizenship never implies eligibility variation

3. Voter eligibility = derived from scenario eligibility_rules; NOT a $grp field
  declare: scenario.group_schema.eligibility_rules: [{dimension, value, voter_eligible: false}]
  engine derives: voter_eligible($grp) = conjunction of its dim-value eligibility annotations
  no eligibility rules + no schema → all $grps 100% voter-eligible; field doesn't exist in data

4. Engine has NO dimension vocabulary
  dim names+values = open strings; engine doesn't know race is protected class
  no restriction on which dims may carry eligibility_rules
    → historical suppression scenarios valid (e.g. race: Black, voter_eligible: false)
    → counterfactual scenarios valid (e.g. age: under_18, voter_eligible: false)
  content guidance OUT OF SCOPE for engine
  rationale: restricting engine would prevent legitimate uses + be circumventable; encodes authors' views

5. vote_shares required for ineligible $grps
  reasons: display rollup (population filters) | counterfactual analysis | data integrity | uniform validation
  authoring tools supply regional defaults to reduce burden

6. Content guidance lives in authoring tool (post-$v1); NOT in engine
  tool MAY: warn on eligibility rules for non-standard dims | show informational text | pre-populate dim pickers
  tool guidance = advisory not prohibitive; scenario author can proceed past warnings
  engine takes no position

7. Voter weight formula
  voter_weight($grp) = population_share × voter_eligible($grp,rules) × turnout_rate
  $CVAP-equivalent: use citizenship dim if present; else full population

§CONSEQUENCES
Scenario format: $grps=flat named list; schema optional; if present→completeness applies
Sim API: engine derives eligibility from eligibility_rules; no voter_eligible field on $grp
$VRA: $CVAP denominator if citizenship dim present; else full population
Authoring tool: content guidance responsibility; engine neutral
Legal/disclaimer: deferred → LEGAL-001

§REFS
Election sim ADR: thoughts/shared/decisions/2026-04-24-election-simulation-architecture.md
Legal ticket: thoughts/shared/tickets/LEGAL-001-content-presentation-risks.md
